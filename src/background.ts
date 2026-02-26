import type { TabInfo, Message, GetSelectedTabsResponse, CopyTabsResponse } from './types';

// 選択中のタブからMarkdownテキストを生成する
function buildMarkdown(tabs: TabInfo[]): string {
  return tabs.map(tab => `- [${tab.title}](${tab.url})`).join('\n');
}

// スクリプト注入が可能なURLかどうかを判定する（ホワイトリスト方式）
function canInjectScript(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const protocol = new URL(url).protocol;
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

// クリップボードにコピーする（アクティブタブにスクリプトを注入）
async function copyToClipboard(text: string): Promise<void> {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // http/https 以外のページにはスクリプトを注入できない
  if (!activeTab?.id || !canInjectScript(activeTab.url)) {
    await copyViaOffscreen(text);
    return;
  }

  await chrome.scripting.executeScript({
    target: { tabId: activeTab.id },
    func: (content: string) => {
      navigator.clipboard.writeText(content);
    },
    args: [text]
  });
}

// chrome:// ページなどでのフォールバック用
async function copyViaOffscreen(text: string): Promise<void> {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT]
  });

  if (existingContexts.length === 0) {
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: [chrome.offscreen.Reason.CLIPBOARD],
      justification: 'タブ情報をクリップボードにコピーするため'
    });
  }

  await chrome.runtime.sendMessage({
    type: 'copy-to-clipboard',
    text
  });
}

// ショートカットキーのハンドラ
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'copy-tabs') {
    const tabs = await chrome.tabs.query({ highlighted: true, currentWindow: true });
    const tabInfos: TabInfo[] = tabs
      .filter((t): t is chrome.tabs.Tab & { title: string; url: string } =>
        t.title !== undefined && t.url !== undefined
      )
      .map(t => ({ title: t.title, url: t.url }));
    const markdown = buildMarkdown(tabInfos);
    await copyToClipboard(markdown);
  }
});

// ランタイムでメッセージの型を検証する
function isValidMessage(message: unknown): message is Message {
  if (!message || typeof message !== 'object' || !('type' in message)) return false;
  const msg = message as Record<string, unknown>;
  if (msg.type === 'get-selected-tabs') return true;
  if (msg.type === 'copy-tabs' && Array.isArray(msg.tabs)) return true;
  if (msg.type === 'copy-to-clipboard' && typeof msg.text === 'string') return true;
  return false;
}

// ポップアップからのメッセージを処理
chrome.runtime.onMessage.addListener((
  message: unknown,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: GetSelectedTabsResponse | CopyTabsResponse) => void
) => {
  // 同一拡張からのメッセージのみ受け付ける
  if (sender.id !== chrome.runtime.id) return;
  if (!isValidMessage(message)) return;

  if (message.type === 'get-selected-tabs') {
    chrome.tabs.query({ highlighted: true, currentWindow: true }).then(tabs => {
      const tabInfos: TabInfo[] = tabs
        .filter((t): t is chrome.tabs.Tab & { title: string; url: string } =>
          t.title !== undefined && t.url !== undefined
        )
        .map(t => ({ title: t.title, url: t.url }));
      sendResponse({ tabs: tabInfos });
    });
    return true; // 非同期レスポンスを有効にする
  }

  if (message.type === 'copy-tabs') {
    const markdown = buildMarkdown(message.tabs);
    copyToClipboard(markdown).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
});

import type { TabInfo, Message, GetSelectedTabsResponse, CopyTabsResponse } from './types';

// 選択中のタブからMarkdownテキストを生成する
function buildMarkdown(tabs: TabInfo[]): string {
  return tabs.map(tab => `- [${tab.title}](${tab.url})`).join('\n');
}

// クリップボードにコピーする（アクティブタブにスクリプトを注入）
async function copyToClipboard(text: string): Promise<void> {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // chrome:// や chrome-extension:// ページにはスクリプトを注入できない
  if (!activeTab?.url || !activeTab.id ||
      activeTab.url.startsWith('chrome://') ||
      activeTab.url.startsWith('chrome-extension://')) {
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

// ポップアップからのメッセージを処理
chrome.runtime.onMessage.addListener((
  message: Message,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response: GetSelectedTabsResponse | CopyTabsResponse) => void
) => {
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

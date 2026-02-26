// 選択中のタブからMarkdownテキストを生成する
function buildMarkdown(tabs) {
  return tabs.map(tab => `- [${tab.title}](${tab.url})`).join('\n');
}

// クリップボードにコピーする（アクティブタブにスクリプトを注入）
async function copyToClipboard(text) {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // chrome:// や chrome-extension:// ページにはスクリプトを注入できない
  if (activeTab.url.startsWith('chrome://') || activeTab.url.startsWith('chrome-extension://')) {
    // offscreen documentを使ったフォールバック
    await copyViaOffscreen(text);
    return;
  }

  await chrome.scripting.executeScript({
    target: { tabId: activeTab.id },
    func: (content) => {
      navigator.clipboard.writeText(content);
    },
    args: [text]
  });
}

// chrome:// ページなどでのフォールバック用
async function copyViaOffscreen(text) {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT']
  });

  if (existingContexts.length === 0) {
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['CLIPBOARD'],
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
    const markdown = buildMarkdown(tabs);
    await copyToClipboard(markdown);
  }
});

// ポップアップからのメッセージを処理
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'get-selected-tabs') {
    chrome.tabs.query({ highlighted: true, currentWindow: true }).then(tabs => {
      sendResponse({ tabs: tabs.map(t => ({ title: t.title, url: t.url })) });
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

// chrome:// ページなどでクリップボードコピーが使えない場合のフォールバック
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'copy-to-clipboard') {
    const textarea = document.createElement('textarea');
    textarea.value = message.text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
  }
});

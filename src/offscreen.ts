// chrome:// ページなどでクリップボードコピーが使えない場合のフォールバック
chrome.runtime.onMessage.addListener((
  message: unknown,
  sender: chrome.runtime.MessageSender
) => {
  // 同一拡張からのメッセージのみ受け付ける
  if (sender.id !== chrome.runtime.id) return;
  if (!message || typeof message !== 'object' || !('type' in message)) return;

  const msg = message as Record<string, unknown>;
  if (msg.type === 'copy-to-clipboard' && typeof msg.text === 'string') {
    const textarea = document.createElement('textarea');
    textarea.value = msg.text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
  }
});

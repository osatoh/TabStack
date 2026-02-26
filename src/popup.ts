import type { TabInfo, GetSelectedTabsResponse } from './types';

const tabListEl = document.getElementById('tab-list') as HTMLDivElement;
const tabCountEl = document.getElementById('tab-count') as HTMLSpanElement;
const copyBtn = document.getElementById('copy-btn') as HTMLButtonElement;

let selectedTabs: TabInfo[] = [];

// 選択中のタブ一覧を取得して表示する
async function loadTabs(): Promise<void> {
  const response: GetSelectedTabsResponse = await chrome.runtime.sendMessage({ type: 'get-selected-tabs' });
  selectedTabs = response.tabs;

  if (selectedTabs.length === 0) {
    tabListEl.innerHTML = '<div class="empty">選択中のタブがありません</div>';
    tabCountEl.textContent = '';
    copyBtn.disabled = true;
    return;
  }

  tabCountEl.textContent = `${selectedTabs.length}個のタブ`;

  tabListEl.innerHTML = selectedTabs
    .map(tab => {
      const faviconUrl = new URL(tab.url).origin + '/favicon.ico';
      return `
        <div class="tab-item">
          <img src="${faviconUrl}" alt="" onerror="this.style.display='none'">
          <span class="tab-title">${escapeHtml(tab.title)}</span>
        </div>
      `;
    })
    .join('');
}

// HTMLエスケープ
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// コピーボタンのクリックハンドラ
copyBtn.addEventListener('click', async () => {
  const markdown = selectedTabs
    .map(tab => `- [${tab.title}](${tab.url})`)
    .join('\n');

  await navigator.clipboard.writeText(markdown);

  copyBtn.textContent = 'コピーしたぜ！';
  copyBtn.classList.add('copied');

  setTimeout(() => {
    copyBtn.textContent = 'コピー';
    copyBtn.classList.remove('copied');
  }, 1500);
});

loadTabs();

import type { TabInfo, GetSelectedTabsResponse } from './types';

const tabListEl = document.getElementById('tab-list') as HTMLDivElement;
const tabCountEl = document.getElementById('tab-count') as HTMLSpanElement;
const copyBtn = document.getElementById('copy-btn') as HTMLButtonElement;

let selectedTabs: TabInfo[] = [];

// favicon URLを安全に取得する（http/httpsのみ）
function getFaviconUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return parsed.origin + '/favicon.ico';
  } catch {
    return null;
  }
}

// タブ一覧の項目をDOM APIで安全に生成する
function createTabItem(tab: TabInfo): HTMLDivElement {
  const item = document.createElement('div');
  item.className = 'tab-item';

  const faviconUrl = getFaviconUrl(tab.url);
  if (faviconUrl) {
    const img = document.createElement('img');
    img.src = faviconUrl;
    img.alt = '';
    img.width = 16;
    img.height = 16;
    img.addEventListener('error', () => { img.style.display = 'none'; });
    item.appendChild(img);
  }

  const span = document.createElement('span');
  span.className = 'tab-title';
  span.textContent = tab.title;
  item.appendChild(span);

  return item;
}

// 選択中のタブ一覧を取得して表示する
async function loadTabs(): Promise<void> {
  const response: GetSelectedTabsResponse = await chrome.runtime.sendMessage({ type: 'get-selected-tabs' });
  selectedTabs = response.tabs;

  if (selectedTabs.length === 0) {
    tabListEl.textContent = '';
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = '選択中のタブがありません';
    tabListEl.appendChild(empty);
    tabCountEl.textContent = '';
    copyBtn.disabled = true;
    return;
  }

  tabCountEl.textContent = `${selectedTabs.length}個のタブ`;

  tabListEl.textContent = '';
  for (const tab of selectedTabs) {
    tabListEl.appendChild(createTabItem(tab));
  }
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

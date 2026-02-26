# TabStack

選択したタブをMarkdown形式でまとめてコピーするChrome拡張機能。

## 使い方

1. Chromeでタブを複数選択（`Cmd` を押しながらタブをクリック）
2. `Ctrl+C` でクリップボードにコピー

コピーされる形式:

```
- [タブのタイトル](https://example.com)
- [タブのタイトル](https://example.com)
```

ツールバーのアイコンからポップアップを開いてコピーすることもできます。

## インストール

### Chrome Web Store

準備中

### 開発版

1. リポジトリをクローン
2. 依存パッケージをインストール & ビルド
   ```bash
   npm install
   npm run build
   ```
3. `chrome://extensions/` を開く
4. 「デベロッパーモード」をONにする
5. 「パッケージ化されていない拡張機能を読み込む」をクリック
6. `dist/` フォルダを選択

## 開発

```bash
npm install          # 依存パッケージのインストール
npm run build        # ビルド（dist/ に出力）
npm run typecheck    # 型チェック
npm run watch        # ウォッチモード（ファイル変更で自動ビルド）
```

TypeScriptソースは `src/` に、ビルド成果物は `dist/` に出力されます。

## 権限

| 権限 | 理由 |
|------|------|
| `tabs` | タブのタイトルとURLを取得するため |
| `scripting` | クリップボードへのコピーを実行するため |
| `activeTab` | アクティブタブへのスクリプト注入のため |
| `offscreen` | chrome://ページでのクリップボードコピーのフォールバック |

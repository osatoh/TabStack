/** タブの基本情報 */
export interface TabInfo {
  title: string;
  url: string;
}

/** メッセージ型（discriminated union） */
export type Message =
  | { type: 'get-selected-tabs' }
  | { type: 'copy-tabs'; tabs: TabInfo[] }
  | { type: 'copy-to-clipboard'; text: string };

/** get-selected-tabs のレスポンス */
export interface GetSelectedTabsResponse {
  tabs: TabInfo[];
}

/** copy-tabs のレスポンス */
export interface CopyTabsResponse {
  success: boolean;
}

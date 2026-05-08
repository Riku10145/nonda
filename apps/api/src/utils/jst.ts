// JST 固定で「今日」の UTC 範囲 [start, end) を返す。
//Todo: ユーザーごとの timezone を持たせる場合はここを users.timezone 参照に差し替える。
//Todo: タイムゾーン処理が増えたら date-fns-tz / Temporal などのライブラリ導入を検討する。

const _JST_OFFSET_MS = 9 * 60 * 60 * 1000;

export const getJstTodayRange = (now: Date = new Date()): { start: Date; end: Date } => {
  const jstNow = new Date(now.getTime() + JST_OFFSET_MS);
  const jstMidnight = Date.UTC(jstNow.getUTCFullYear(), jstNow.getUTCMonth(), jstNow.getUTCDate());
  const start = new Date(jstMidnight - JST_OFFSET_MS);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
};

// "YYYY-MM-DD" (JST) を JST 0:00 の UTC Date に変換する。
export const jstDateStringToUtc = (dateStr: string): Date => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d) - JST_OFFSET_MS);
};

// UTC Date を JST 基準の "YYYY-MM-DD" に変換する。
export const utcToJstDateString = (date: Date): string => {
  const jst = new Date(date.getTime() + JST_OFFSET_MS);
  return jst.toISOString().slice(0, 10);
};

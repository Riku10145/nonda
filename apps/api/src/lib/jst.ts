// JST 固定で「今日」の UTC 範囲 [start, end) を返す。
//Todo: ユーザーごとの timezone を持たせる場合はここを users.timezone 参照に差し替える。
//Todo: タイムゾーン処理が増えたら date-fns-tz / Temporal などのライブラリ導入を検討する。
export const getJstTodayRange = (now: Date = new Date()): { start: Date; end: Date } => {
  const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
  const jstNow = new Date(now.getTime() + JST_OFFSET_MS);
  const jstMidnight = Date.UTC(jstNow.getUTCFullYear(), jstNow.getUTCMonth(), jstNow.getUTCDate());
  const start = new Date(jstMidnight - JST_OFFSET_MS);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
};

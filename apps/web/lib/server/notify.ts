import "server-only";

import { apiGet, apiPut } from "@/lib/api-client";
import type { NotifyTriplet } from "@/lib/domain/notify";
import { _parseNotifyTriplet, _wireNotifyBody } from "./_wire";

export const loadNotifyTriplet = async (): Promise<NotifyTriplet> => {
  const raw = await apiGet<unknown>("/v1/notification-settings");
  return _parseNotifyTriplet(raw);
};

export const commitNotifyTriplet = async (t: NotifyTriplet): Promise<void> => {
  await apiPut("/v1/notification-settings", _wireNotifyBody(t));
};

/**
 * Maps persisted notification `type` + optional `data` JSON to user-facing source labels
 * (PLAN-20 jobs, PLAN-17 collaboration, PLAN-24 security/MFA).
 */

export type NotificationSource = "plan17" | "plan20" | "plan24" | "generic";

export function getNotificationSource(
  type: string,
  data?: Record<string, unknown> | null
): NotificationSource {
  const d = data as { source?: string; plan?: string } | undefined;
  if (d?.plan === "plan17" || d?.source === "collab" || type === "COLLAB") return "plan17";
  if (d?.plan === "plan24" || d?.source === "mfa" || d?.source === "security" || type === "SECURITY") {
    return "plan24";
  }
  if (
    d?.plan === "plan20" ||
    type === "LOW_STOCK" ||
    type === "IMPORTANT_SALE" ||
    type === "PENDING_TASK" ||
    type === "SYSTEM"
  ) {
    return "plan20";
  }
  return "generic";
}

export function getNotificationSourceLabel(source: NotificationSource): string {
  switch (source) {
    case "plan17":
      return "Colaboración";
    case "plan20":
      return "Automatización";
    case "plan24":
      return "Seguridad";
    default:
      return "General";
  }
}

export function getInAppNotificationMeta(type: string, data?: Record<string, unknown> | null) {
  const source = getNotificationSource(type, data);
  return {
    source,
    sourceLabel: getNotificationSourceLabel(source),
  };
}

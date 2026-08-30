import { COLORS } from "./theme";

export const STATUS_COLORS: Record<string, string> = {
  pending: COLORS.warning,
  approved: COLORS.info,
  borrowed: COLORS.info,
  returned: COLORS.success,
  denied: COLORS.destructive,
  rejected: COLORS.destructive,
  return_requested: COLORS.teal,
  damaged: COLORS.destructive,
};

export const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  borrowed: "Borrowed",
  returned: "Returned",
  denied: "Denied",
  rejected: "Denied",
  return_requested: "Return Requested",
  damaged: "Damaged",
};

export const statusColor = (status: string) =>
  STATUS_COLORS[status] || COLORS.silver;

export const statusLabel = (status: string) => STATUS_LABELS[status] || status;

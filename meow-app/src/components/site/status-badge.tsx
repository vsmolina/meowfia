import { cn } from "@/lib/utils";

const TONES: Record<string, string> = {
  PAID: "bg-olive text-paper",
  APPROVED: "bg-olive text-paper",
  ACTIVE: "bg-olive text-paper",
  DELIVERED: "bg-olive text-paper",
  COMPLETED: "bg-olive text-paper",
  WON: "bg-olive text-paper",
  SENT: "bg-olive text-paper",
  OPEN: "bg-olive text-paper",
  SHIPPED: "bg-[#2f5d62] text-paper",
  PROCESSING: "bg-kraft text-ink",
  IN_PROGRESS: "bg-kraft text-ink",
  QUOTED: "bg-kraft text-ink",
  ACCEPTED: "bg-kraft text-ink",
  DEPOSIT_PAID: "bg-kraft text-ink",
  TRIALING: "bg-kraft text-ink",
  PENDING: "bg-khaki text-ink",
  UNFULFILLED: "bg-khaki text-ink",
  REQUESTED: "bg-khaki text-ink",
  NEW: "bg-khaki text-ink",
  DRAFT: "bg-khaki text-ink",
  NOT_REQUIRED: "bg-muted text-muted-foreground",
  REJECTED: "bg-stamp text-paper",
  CANCELLED: "bg-stamp text-paper",
  CANCELED: "bg-stamp text-paper",
  REFUNDED: "bg-stamp text-paper",
  DECLINED: "bg-stamp text-paper",
  PAST_DUE: "bg-stamp text-paper",
  CLOSED: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status, label, className }: { status: string; label?: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded px-2 py-0.5 font-mono text-[0.68rem] font-medium uppercase tracking-wider", TONES[status] ?? "bg-muted", className)}>
      {label ?? (status === "NOT_REQUIRED" ? "Digital" : status.replace(/_/g, " ").toLowerCase())}
    </span>
  );
}

/** Human labels for enum values. Safe for client and server. */
export const VEHICLE_LABELS = { TANK: "Tank", PLANE: "Plane", BOAT: "Warship", OTHER: "Special Ops" } as const;
export const DIFFICULTY_LABELS = { RECRUIT: "Recruit", SOLDIER: "Soldier", VETERAN: "Veteran", ELITE: "Elite" } as const;
export const DIFFICULTY_LEVEL = { RECRUIT: 1, SOLDIER: 2, VETERAN: 3, ELITE: 4 } as const;
export const CAT_SIZE_LABELS = { KITTEN: "Kitten", STANDARD: "Standard", CHONK: "Chonk" } as const;
export const CAT_SIZE_HINTS = { KITTEN: "under 7 lb", STANDARD: "7–12 lb", CHONK: "12 lb+" } as const;
export const LICENSE_LABELS = { PERSONAL: "Personal", COMMERCIAL: "Commercial", CLASSROOM: "Classroom" } as const;
export const CHANNEL_LABELS = {
  TEMPLATES: "Templates",
  KITS: "Pre-cut Kits",
  MERCH: "Merch",
  COMMISSIONS: "Commissions",
  MEMBERSHIPS: "Memberships",
  TIPS: "Tips",
  GIFT_CARDS: "Gift Cards",
} as const;
export const COMMISSION_STATUS_LABELS = {
  REQUESTED: "Requested",
  DEPOSIT_PAID: "Deposit paid",
  QUOTED: "Quoted",
  ACCEPTED: "Accepted",
  IN_PROGRESS: "In the workshop",
  SHIPPED: "Shipped",
  COMPLETED: "Completed",
  DECLINED: "Declined",
} as const;

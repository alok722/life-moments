export const EVENT_TYPES = [
  { value: "birthday", label: "Birthday" },
  { value: "anniversary", label: "Anniversary" },
  { value: "bill", label: "Bill" },
  { value: "custom", label: "Custom" },
] as const;

export const RECURRENCE_TYPES = [
  { value: "yearly", label: "Yearly" },
  { value: "monthly", label: "Monthly" },
  { value: "custom", label: "Custom" },
] as const;

export const EVENT_TYPE_ICONS: Record<string, string> = {
  birthday: "🎂",
  anniversary: "💍",
  bill: "💳",
  custom: "📌",
};

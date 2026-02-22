export const EVENT_TYPES = [
  { value: "birthday", label: "Birthday" },
  { value: "anniversary", label: "Anniversary" },
  { value: "bill", label: "Bill" },
  { value: "custom", label: "Custom" },
] as const;

export const RECURRENCE_TYPES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
] as const;

export const REMINDER_OFFSETS = [
  { value: "1h", label: "1 hour before" },
  { value: "4h", label: "4 hours before" },
  { value: "1d", label: "1 day before" },
  { value: "2d", label: "2 days before" },
  { value: "1w", label: "1 week before" },
  { value: "same", label: "On the day" },
] as const;

export const RELATIONS = [
  { value: "Mother", label: "Mother" },
  { value: "Father", label: "Father" },
  { value: "Sister", label: "Sister" },
  { value: "Brother", label: "Brother" },
  { value: "Wife", label: "Wife" },
  { value: "Husband", label: "Husband" },
  { value: "Son", label: "Son" },
  { value: "Daughter", label: "Daughter" },
  { value: "Friend", label: "Friend" },
  { value: "Colleague", label: "Colleague" },
  { value: "Boss", label: "Boss" },
  { value: "Other", label: "Other" },
] as const;

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

export const EVENT_TYPE_ICONS: Record<string, string> = {
  birthday: "🎂",
  anniversary: "💍",
  bill: "💳",
  custom: "📌",
};

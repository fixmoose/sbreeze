// IRS Schedule E (Form 1040) expense categories for a residential rental.
// Picking the right line here makes year-end filing a copy-paste job.
export const SCHEDULE_E_CATEGORIES = [
  "Advertising",
  "Auto and travel",
  "Cleaning and maintenance",
  "Commissions",
  "Insurance",
  "Legal and other professional fees",
  "Management fees",
  "Mortgage interest paid to banks",
  "Other interest",
  "Repairs",
  "Supplies",
  "Taxes",
  "Utilities",
  "Depreciation",
  "Other",
] as const;

export type ScheduleECategory = (typeof SCHEDULE_E_CATEGORIES)[number];

// The IRS threshold for issuing a vendor a 1099-NEC for services in a year.
export const FORM_1099_THRESHOLD = 600;

export const TAX_LANDLORD_NAME = "Dejan Obradovic";

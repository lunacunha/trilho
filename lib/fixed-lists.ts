// Fixed lists (SPEC §4, §5). Loaded into the database by the seed; not editable in the MVP.
// Imported by db/seed.ts (run with native Node), so imports here use relative `.ts` paths.

export const SECTORS = [
  "Consulting",
  "Energy & Utilities",
  "Finance & Banking",
  "Industry & Manufacturing",
  "Logistics & Supply Chain",
  "Retail & Consumer Goods",
  "Technology & Software",
  "Telecom",
  "Health",
  "Public Sector",
  "Other",
] as const;
export type Sector = (typeof SECTORS)[number];

export const CHANNELS = [
  "Company portal",
  "LinkedIn Easy Apply",
  "LinkedIn (external)",
  "Referral",
  "Career Fair",
  "Job board",
  "Spontaneous application",
  "Other",
] as const;
export type Channel = (typeof CHANNELS)[number];

export const JOB_TYPES = [
  "Summer internship",
  "Professional internship",
  "Trainee programme",
  "Full-time",
  "Dissertation in a company",
] as const;
export type JobType = (typeof JOB_TYPES)[number];

/** Statuses a student can choose (R6). "no_response" is set by the system only (R5). */
export const MANUAL_STATUSES = ["sent", "in_process", "interview", "offer", "rejected"] as const;
export type ManualStatus = (typeof MANUAL_STATUSES)[number];

/** Pipeline columns (SPEC §4). "closed" groups Rejected and No response. */
export const PIPELINE_COLUMNS = ["sent", "in_process", "interview", "offer", "closed"] as const;
export type PipelineColumn = (typeof PIPELINE_COLUMNS)[number];

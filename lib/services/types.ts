// Types shared by the services and their callers (Server Actions, pages).
import type { ApplicationStatus, UserRole } from "../../db/schema.ts";
import type { PipelineColumn } from "../fixed-lists.ts";
import type { ReminderReason } from "../rules/types.ts";

/** The logged-in user, read from the session by the entry layer. */
export type CurrentUser = { id: string; role: UserRole; consent: boolean | null };

export type HistoryEntry = {
  status: ApplicationStatus;
  changedOn: string;
  isAutomatic: boolean;
  /** Days since the date sent ("after N days", US04-1). */
  daysAfterSent: number;
};

export type ApplicationDetail = {
  id: string;
  company: { id: string; name: string };
  roleTitle: string;
  sector: string;
  channel: string;
  jobType: string;
  dateSent: string;
  currentStatus: ApplicationStatus;
  /** Chronological order. */
  history: HistoryEntry[];
};

export type PipelineCard = {
  id: string;
  companyName: string;
  roleTitle: string;
  status: ApplicationStatus;
  /** R10 */
  daysSinceSent: number;
  reminder: { daysQuiet: number; reason: ReminderReason } | null;
};

export type Pipeline = { columns: Record<PipelineColumn, PipelineCard[]> };

export type CompanyPage = {
  id: string;
  name: string;
  statistic: { label: string; basedOn: number } | null;
};

export type DashboardRow = { name: string; applications: number; replyRate: number };

export type Dashboard = {
  activeStudents: number;
  medianDaysToFirstReply: number | null;
  companies: DashboardRow[];
  channels: DashboardRow[];
};

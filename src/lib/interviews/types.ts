export const DURATIONS = [
  { minutes: 5, label: "5 min", hint: "Quick drill" },
  { minutes: 12, label: "12 min", hint: "Standard" },
  { minutes: 20, label: "20 min", hint: "Deep" },
  { minutes: 30, label: "30 min", hint: "Loop" },
] as const;

export const LANGUAGES = [
  { id: "English", tts: "en", label: "English" },
  { id: "Hindi", tts: "hi", label: "Hindi" },
  { id: "Tamil", tts: "ta", label: "Tamil" },
  { id: "Telugu", tts: "te", label: "Telugu" },
  { id: "Kannada", tts: "kn", label: "Kannada" },
  { id: "Malayalam", tts: "ml", label: "Malayalam" },
  { id: "Marathi", tts: "mr", label: "Marathi" },
  { id: "Bengali", tts: "bn", label: "Bengali" },
  { id: "Gujarati", tts: "gu", label: "Gujarati" },
  { id: "Punjabi", tts: "pa", label: "Punjabi" },
  { id: "Odia", tts: "or", label: "Odia" },
] as const;

export type LanguageId = (typeof LANGUAGES)[number]["id"];

export type RoomStatus =
  | "idle"
  | "connecting"
  | "speaking"
  | "listening"
  | "thinking"
  | "ending"
  | "ended"
  | "error";

export type TurnRole = "interviewer" | "candidate";

export type Turn = {
  id: string;
  role: TurnRole;
  content: string;
  at: number;
};

export const TRACKS = [
  { id: "Analyst", label: "Analyst" },
  { id: "Advanced Analyst", label: "Advanced Analyst" },
] as const;

export type JobTitle = (typeof TRACKS)[number]["id"];

export const INTERVIEW_TYPES = [
  { id: "HR Interview", label: "HR Interview" },
  { id: "Technical Interview", label: "Technical Interview" },
  { id: "Behavioral Interview", label: "Behavioral Interview" },
] as const;

export type InterviewType = (typeof INTERVIEW_TYPES)[number]["id"];

export type InterviewConfig = {
  candidateName: string;
  jobTitle: JobTitle;
  companyName: string;
  interviewType: InterviewType;
  supportContact: string;
  userName: string;
  language: LanguageId;
  durationMin: number;
  focus: string;
};

export type ScoreKey =
  | "communication"
  | "structure"
  | "depth"
  | "presence"
  | "fit";

export type Evaluation = {
  summary: string;
  scores: Record<ScoreKey, number>;
  highlights: string[];
  misses: string[];
  followUps: string[];
  betterAnswers: { question: string; note: string }[];
};

export type InterviewSession = {
  id: string;
  createdAt: number;
  startedAt: number | null;
  endedAt: number | null;
  config: InterviewConfig;
  turns: Turn[];
  status: RoomStatus;
  error: string | null;
  report: Evaluation | null;
  callSummary: string | null;
};

export type SarvamCredentials = {
  apiKey: string;
  orgId: string;
  workspaceId: string;
  appId: string;
};

export const SCORE_LABELS: Record<ScoreKey, string> = {
  communication: "Communication",
  structure: "Structure",
  depth: "Depth",
  presence: "Presence",
  fit: "Role fit",
};

export const DEFAULT_CONFIG: InterviewConfig = {
  candidateName: "Zeelsh",
  jobTitle: "Analyst",
  companyName: "Knowcraft Analytics",
  interviewType: "HR Interview",
  supportContact: "talent@knowcraft.in",
  userName: "Manan",
  language: "English",
  durationMin: 12,
  focus: "",
};

const JOB_TITLES = new Set<string>(TRACKS.map((t) => t.id));
const INTERVIEW_TYPE_IDS = new Set<string>(INTERVIEW_TYPES.map((t) => t.id));
const LANGUAGE_IDS = new Set<string>(LANGUAGES.map((l) => l.id));

/** Normalize any partial / legacy persisted config into a full InterviewConfig. */
export function normalizeConfig(raw: unknown): InterviewConfig {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

  // Legacy shape: role / customRole / company / seniority / engine
  const legacyRole = String(r.role ?? "");
  const legacyCustom = String(r.customRole ?? "");
  let jobTitle: JobTitle = "Analyst";
  if (JOB_TITLES.has(String(r.jobTitle))) {
    jobTitle = r.jobTitle as JobTitle;
  } else if (legacyRole === "custom" && legacyCustom) {
    // fall through to Analyst
  } else if (legacyRole.toLowerCase().includes("advanced")) {
    jobTitle = "Advanced Analyst";
  }

  const interviewType = INTERVIEW_TYPE_IDS.has(String(r.interviewType))
    ? (r.interviewType as InterviewType)
    : "HR Interview";

  const language = LANGUAGE_IDS.has(String(r.language))
    ? (r.language as LanguageId)
    : "English";

  const durationMin = Number(r.durationMin);
  const safeDuration = DURATIONS.some((d) => d.minutes === durationMin)
    ? durationMin
    : 12;

  return {
    candidateName: String(r.candidateName ?? DEFAULT_CONFIG.candidateName),
    jobTitle,
    companyName: String(
      r.companyName ?? r.company ?? DEFAULT_CONFIG.companyName,
    ),
    interviewType,
    supportContact: String(r.supportContact ?? DEFAULT_CONFIG.supportContact),
    userName: String(r.userName ?? DEFAULT_CONFIG.userName),
    language,
    durationMin: safeDuration,
    focus: String(r.focus ?? ""),
  };
}

export function normalizeCredentials(raw: unknown): SarvamCredentials {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    apiKey: String(r.apiKey ?? ""),
    orgId: String(r.orgId ?? ""),
    workspaceId: String(r.workspaceId ?? ""),
    appId: String(r.appId ?? ""),
  };
}

export function roleLabel(config: InterviewConfig): string {
  return config.jobTitle || "Analyst";
}

export function toAgentVariables(config: InterviewConfig): Record<string, string> {
  const c = normalizeConfig(config);
  return {
    CANDIDATE_NAME: c.candidateName.trim() || "Zeelsh",
    COMPANY_NAME: c.companyName.trim() || "Knowcraft Analytics",
    INTERVIEW_TYPE: c.interviewType,
    JOB_TITLE: c.jobTitle,
    SUPPORT_CONTACT: c.supportContact.trim() || "talent@knowcraft.in",
    user_name: c.userName.trim() || "Manan",
  };
}

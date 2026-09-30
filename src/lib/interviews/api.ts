import type { Evaluation, InterviewConfig, Turn } from "./types";

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as T;
  return data;
}

export function askInterviewer(input: {
  config: InterviewConfig;
  turns: Turn[];
  remainingSec: number;
}) {
  return post<{ ok: true; say: string; done: boolean } | { ok: false; error: string }>(
    "/api/ask",
    input,
  );
}

export function speakText(input: { text: string; language: string }) {
  return post<
    | { ok: true; audioBase64: string; mimeType: string }
    | { ok: false; error: string }
  >("/api/speak", input);
}

export function transcribeAudio(input: { audioBase64: string; mimeType: string }) {
  return post<{ ok: true; text: string } | { ok: false; error: string }>(
    "/api/transcribe",
    input,
  );
}

export function evaluateInterview(input: {
  config: InterviewConfig;
  turns: Turn[];
}) {
  return post<{ ok: true; report: Evaluation } | { ok: false; error: string }>(
    "/api/evaluate",
    input,
  );
}

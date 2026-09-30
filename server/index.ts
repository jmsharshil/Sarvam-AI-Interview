import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const isProd = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT || 8787);

const app = express();
app.use(cors());
app.use(express.json({ limit: "8mb" }));

function apiKey() {
  return process.env.XAI_API_KEY?.trim() || null;
}

function extractJson(text: string): unknown {
  const trimmed = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("Could not parse model output");
  }
}

async function chat(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  opts: { max_tokens: number; temperature: number },
) {
  const key = apiKey();
  if (!key) return { ok: false as const, error: "XAI_API_KEY is not set" };

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "grok-4.5",
      messages,
      max_tokens: opts.max_tokens,
      temperature: opts.temperature,
    }),
  });

  if (!res.ok) {
    return { ok: false as const, error: `Interviewer unavailable (${res.status})` };
  }

  const body = (await res.json()) as {
    choices?: { message?: { content?: string | null } }[];
  };
  const text = body.choices?.[0]?.message?.content?.trim() ?? "";
  if (!text) return { ok: false as const, error: "Empty interviewer response" };
  return { ok: true as const, text };
}

function briefing(config: {
  candidateName?: string;
  jobTitle?: string;
  companyName?: string;
  interviewType?: string;
  supportContact?: string;
  userName?: string;
  language?: string;
  focus?: string;
}) {
  const focus = (config.focus || "").trim()
    ? `Focus: ${config.focus!.trim()}.`
    : "";
  return `Candidate: ${(config.candidateName || "").trim() || "the candidate"}.
Job title: ${config.jobTitle || "Analyst"}.
Interview type: ${config.interviewType || "HR Interview"}.
Company: ${config.companyName || "Knowcraft Analytics"}.
Interviewer: ${config.userName || "Manan"}.
Support: ${config.supportContact || "talent@knowcraft.in"}.
Language: ${config.language || "English"}.
${focus}`;
}

app.post("/api/ask", async (req, res) => {
  try {
    const { config, turns = [], remainingSec = 600 } = req.body ?? {};
    const history = (turns as { role: string; content: string }[])
      .slice(-18)
      .map((t) => ({
        role: (t.role === "interviewer" ? "assistant" : "user") as
          | "assistant"
          | "user",
        content: String(t.content).slice(0, 1800),
      }));
    const remaining = Math.max(0, Math.round(Number(remainingSec) || 0));
    const closing = remaining < 25;

    const result = await chat(
      [
        {
          role: "system",
          content: `You are a live hiring interviewer speaking out loud. Not a coach. One question at a time. Under 45 words. Follow up when vague. Match the candidate language. Return JSON only: {"say":"...","done":false}. Set done=true only when closing.`,
        },
        {
          role: "user",
          content: `${briefing(config)}

Seconds remaining: ${remaining}.
${closing ? "Time is up — close now (done=true)." : "Continue."}
${history.length === 0 ? "Greet briefly, then ask the first question." : "Continue from the conversation."}`,
        },
        ...history,
      ],
      { max_tokens: 280, temperature: 0.7 },
    );

    if (!result.ok) return res.status(500).json(result);

    try {
      const parsed = extractJson(result.text) as { say?: string; done?: boolean };
      const say =
        typeof parsed.say === "string" && parsed.say.trim()
          ? parsed.say.trim()
          : result.text;
      return res.json({ ok: true, say, done: Boolean(parsed.done) || closing });
    } catch {
      return res.json({ ok: true, say: result.text, done: closing });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ask failed";
    res.status(500).json({ ok: false, error: message });
  }
});

app.post("/api/speak", async (req, res) => {
  try {
    const key = apiKey();
    if (!key) return res.status(500).json({ ok: false, error: "XAI_API_KEY is not set" });

    const text = String(req.body?.text ?? "").trim().slice(0, 900);
    const language = String(req.body?.language ?? "en");
    if (!text) return res.status(400).json({ ok: false, error: "Nothing to speak" });

    const langMap: Record<string, string> = {
      English: "en",
      Hindi: "hi",
      Tamil: "ta",
      Telugu: "te",
      Kannada: "kn",
      Malayalam: "ml",
      Marathi: "mr",
      Bengali: "bn",
      Gujarati: "gu",
      Punjabi: "pa",
      Odia: "or",
    };
    const lang = langMap[language] || language || "en";

    const apiRes = await fetch("https://api.x.ai/v1/tts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, voice_id: "naksh", language: lang }),
    });

    if (!apiRes.ok) {
      return res
        .status(500)
        .json({ ok: false, error: `Voice synthesis failed (${apiRes.status})` });
    }

    const buf = Buffer.from(await apiRes.arrayBuffer());
    return res.json({
      ok: true,
      audioBase64: buf.toString("base64"),
      mimeType: apiRes.headers.get("content-type") || "audio/mpeg",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Speak failed";
    res.status(500).json({ ok: false, error: message });
  }
});

app.post("/api/transcribe", async (req, res) => {
  try {
    const key = apiKey();
    if (!key) return res.status(500).json({ ok: false, error: "XAI_API_KEY is not set" });

    const raw = String(req.body?.audioBase64 ?? "").trim();
    const mime = String(req.body?.mimeType || "audio/webm");
    if (!raw) return res.status(400).json({ ok: false, error: "No audio captured" });
    if (raw.length > 6_000_000) {
      return res.status(400).json({ ok: false, error: "Audio clip too long" });
    }

    const bytes = Buffer.from(raw, "base64");
    const ext = mime.includes("mp4")
      ? "mp4"
      : mime.includes("wav")
        ? "wav"
        : mime.includes("mpeg")
          ? "mp3"
          : "webm";

    const form = new FormData();
    form.append("model", "grok-voice-transcribe-2.0");
    form.append("file", new Blob([bytes], { type: mime }), `answer.${ext}`);

    const apiRes = await fetch("https://api.x.ai/v1/stt", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: form,
    });

    if (!apiRes.ok) {
      return res
        .status(500)
        .json({ ok: false, error: `Could not hear that (${apiRes.status})` });
    }

    const body = (await apiRes.json()) as { text?: string; transcript?: string };
    const text = (body.text || body.transcript || "").trim();
    if (!text) return res.status(400).json({ ok: false, error: "I didn't catch that" });
    return res.json({ ok: true, text });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Transcribe failed";
    res.status(500).json({ ok: false, error: message });
  }
});

app.post("/api/evaluate", async (req, res) => {
  try {
    const { config, turns = [] } = req.body ?? {};
    const list = turns as { role: string; content: string }[];

    if (list.length < 2) {
      return res.json({
        ok: true,
        report: {
          summary:
            "Not enough conversation to score. Sit another room and finish a couple of answers.",
          scores: {
            communication: 5,
            structure: 5,
            depth: 5,
            presence: 5,
            fit: 5,
          },
          highlights: [],
          misses: ["Session ended before a real exchange."],
          followUps: ["Try a 12 minute loop and finish two answers."],
          betterAnswers: [],
        },
      });
    }

    const transcript = list
      .map(
        (t) =>
          `${t.role === "interviewer" ? "Interviewer" : "Candidate"}: ${t.content}`,
      )
      .join("\n");

    const result = await chat(
      [
        {
          role: "system",
          content: `Hiring debrief writer. Specific and calm. Scores integers 0-10. JSON only:
{"summary":"...","scores":{"communication":0,"structure":0,"depth":0,"presence":0,"fit":0},"highlights":[],"misses":[],"followUps":[],"betterAnswers":[{"question":"...","note":"..."}]}`,
        },
        {
          role: "user",
          content: `${briefing(config)}\n\nTranscript:\n${transcript.slice(0, 12000)}`,
        },
      ],
      { max_tokens: 1200, temperature: 0.3 },
    );

    if (!result.ok) {
      const list = (turns as { role: string; content: string }[]) || [];
      return res.json({
        ok: true,
        report: {
          summary:
            result.error.includes("XAI_API_KEY")
              ? "Interview complete. Connect an XAI_API_KEY to generate a scored debrief, or review the transcript below."
              : `Interview complete. Debrief unavailable: ${result.error}`,
          scores: {
            communication: 0,
            structure: 0,
            depth: 0,
            presence: 0,
            fit: 0,
          },
          highlights: [],
          misses: [],
          followUps: [],
          betterAnswers: [],
        },
      });
    }

    const parsed = extractJson(result.text) as {
      summary?: string;
      scores?: Record<string, number>;
      highlights?: string[];
      misses?: string[];
      followUps?: string[];
      betterAnswers?: { question?: string; note?: string }[];
    };

    const scores = {
      communication: 5,
      structure: 5,
      depth: 5,
      presence: 5,
      fit: 5,
    };
    for (const key of Object.keys(scores) as (keyof typeof scores)[]) {
      const n = Number(parsed.scores?.[key]);
      if (Number.isFinite(n)) scores[key] = Math.max(0, Math.min(10, Math.round(n)));
    }

    return res.json({
      ok: true,
      report: {
        summary: parsed.summary?.trim() || "Debrief generated.",
        scores,
        highlights: (parsed.highlights || []).map(String).slice(0, 6),
        misses: (parsed.misses || []).map(String).slice(0, 6),
        followUps: (parsed.followUps || []).map(String).slice(0, 6),
        betterAnswers: (parsed.betterAnswers || [])
          .map((item) => ({
            question: String(item.question ?? ""),
            note: String(item.note ?? ""),
          }))
          .filter((item) => item.question || item.note)
          .slice(0, 5),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Evaluate failed";
    res.status(500).json({ ok: false, error: message });
  }
});


app.get("/api/sarvam-config", (_req, res) => {
  const apiKey =
    process.env.VITE_SARVAM_API_KEY?.trim() ||
    process.env.SARVAM_API_KEY?.trim() ||
    "";
  const orgId =
    process.env.VITE_SARVAM_ORG_ID?.trim() ||
    process.env.SARVAM_ORG_ID?.trim() ||
    "";
  const workspaceId =
    process.env.VITE_SARVAM_WORKSPACE_ID?.trim() ||
    process.env.SARVAM_WORKSPACE_ID?.trim() ||
    "";
  const appId =
    process.env.VITE_SARVAM_APP_ID?.trim() ||
    process.env.SARVAM_APP_ID?.trim() ||
    "";
  const configured = Boolean(apiKey && orgId && workspaceId && appId);
  res.json({
    ok: true,
    configured,
    // Only return values when present — for local / internal use
    credentials: configured
      ? { apiKey, orgId, workspaceId, appId }
      : null,
  });
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, hasXai: Boolean(apiKey()) });
});

if (isProd) {
  const dist = path.join(root, "dist");
  app.use(express.static(dist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(dist, "index.html"));
  });
}

app.listen(port, "0.0.0.0", () => {
  console.log(`[viva-api] http://127.0.0.1:${port}`);
  if (!apiKey()) {
    console.warn("[viva-api] XAI_API_KEY missing — Studio mode will fail until you set it.");
  }
});

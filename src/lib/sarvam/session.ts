import type { InterviewConfig, Turn } from "@/lib/interviews/types";
import type { SarvamCredentials } from "@/lib/interviews/types";
import { toAgentVariables } from "@/lib/interviews/types";

export type SarvamHandle = {
  stop: () => Promise<void>;
  mute: () => void;
  unmute: () => void;
  isMuted: () => boolean;
};

export type SarvamCallbacks = {
  onTranscript: (turn: Omit<Turn, "id" | "at">) => void;
  onState: (state: string) => void;
  onLevel: (level: number) => void;
  onError: (message: string) => void;
  onEnd: () => void;
  onExtracted?: (vars: Record<string, string>) => void;
};

export async function connectSarvamAgent(
  creds: SarvamCredentials,
  config: InterviewConfig,
  callbacks: SarvamCallbacks,
): Promise<SarvamHandle> {
  const {
    ConversationAgent,
    BrowserAudioInterface,
    InteractionType,
  } = await import("sarvam-conv-ai-sdk/browser");

  const audioInterface = new BrowserAudioInterface(16000, {
    outputGain: 1.25,
    outputLevelCallback: (level) => {
      callbacks.onLevel(Math.min(1, Math.max(0, level.rms * 2.4)));
    },
  });

  const agentVars = toAgentVariables(config);

  const agent = new ConversationAgent({
    apiKey: creds.apiKey.trim(),
    platform: "browser",
    config: {
      user_identifier_type: "custom",
      user_identifier:
        (config.candidateName || "candidate")
          .trim()
          .replace(/\s+/g, "-")
          .toLowerCase() || "candidate",
      org_id: creds.orgId.trim(),
      workspace_id: creds.workspaceId.trim(),
      app_id: creds.appId.trim(),
      interaction_type: InteractionType.CALL,
      input_sample_rate: 16000,
      output_sample_rate: 16000,
      initial_language_name: config.language as never,
      agent_variables: agentVars,
    },
    audioInterface,
    transcriptCallback: async (msg) => {
      const content = (msg.content || "").trim();
      if (!content) return;
      // The raw server message includes is_final; only commit complete utterances
      const raw = msg as unknown as Record<string, unknown>;
      if (raw["is_final"] === false) return;
      callbacks.onTranscript({
        role: msg.role === "user" ? "candidate" : "interviewer",
        content,
      });
    },
    stateCallback: (state) => callbacks.onState(String(state)),
    endCallback: async () => callbacks.onEnd(),
  });

  try {
    await agent.start();
    const ok = await agent.waitForConnect(12);
    if (!ok) {
      await agent.stop();
      throw new Error(
        "Sarvam did not connect. Check agent IDs, that it is a Voice agent, and that a version is committed.",
      );
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not start the Sarvam agent";
    callbacks.onError(message);
    throw err;
  }

  return {
    stop: () => agent.stop(),
    mute: () => agent.mute(),
    unmute: () => agent.unmute(),
    isMuted: () => agent.isMuted(),
  };
}

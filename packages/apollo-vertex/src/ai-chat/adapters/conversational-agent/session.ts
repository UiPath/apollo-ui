import {
  ConversationalAgent,
  type SessionStream,
} from "@uipath/uipath-typescript/conversational-agent";
import type { ConversationalAgentAdapterConfig } from "./types";

export class SessionManager {
  private readonly config: ConversationalAgentAdapterConfig;
  private readonly conversationalAgent: ConversationalAgent;

  private conversationId: string | null = null;
  private session: SessionStream | null = null;
  private sessionReady: Promise<SessionStream> | null = null;

  private sessionId = 0;

  constructor(config: ConversationalAgentAdapterConfig) {
    this.config = config;
    this.conversationalAgent = new ConversationalAgent(config.sdk);
  }

  async ensureSession(): Promise<SessionStream> {
    if (this.session && !this.session.ended) {
      return this.session;
    }

    if (this.sessionReady) {
      return this.sessionReady;
    }

    this.sessionReady = this.createSession();

    try {
      const session = await this.sessionReady;
      return session;
    } catch (err) {
      this.sessionReady = null;
      throw err;
    }
  }

  dispose(): void {
    this.sessionId++;
    if (this.conversationId && this.session && !this.session.ended) {
      this.conversationalAgent.conversations.endSession(this.conversationId);
    }
    this.session = null;
    this.conversationId = null;
    this.sessionReady = null;
  }

  private async createSession(): Promise<SessionStream> {
    const { agentId, folderId } = this.config;
    const currentSessionId = this.sessionId;

    const conversation = await this.conversationalAgent.conversations.create(
      agentId,
      folderId,
    );

    if (currentSessionId !== this.sessionId) {
      throw new Error("Session creation aborted (manager was disposed)");
    }

    this.conversationId = conversation.id;

    const session = conversation.startSession({ echo: true });

    const ready = await new Promise<SessionStream>((resolve, reject) => {
      session.onSessionStarted(() => resolve(session));
      session.onErrorStart((err) =>
        reject(new Error(err.message ?? "Session failed to start")),
      );
    });

    this.session = ready;
    this.sessionReady = null;

    session.onSessionEnd(() => {
      this.session = null;
      this.conversationId = null;
      this.sessionReady = null;
    });

    return ready;
  }
}

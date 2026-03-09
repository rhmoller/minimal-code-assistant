/** The role of a message author in a conversation. */
export type Role = "system" | "user" | "assistant";
/** A single message in a conversation. */
export interface Message {
    role: Role;
    content: string;
}
/** Request body for POST /v1/chat/completions. */
export interface ChatRequest {
    /** The model identifier to use for completion. */
    model: string;
    /** The conversation history, in order. */
    messages: Message[];
    /** If true, stream partial tokens back as server-sent events. */
    stream?: boolean;
    /** Sampling temperature (0–2). Higher = more random. */
    temperature?: number;
    /** Maximum number of tokens to generate. */
    max_tokens?: number;
}
/** Why the model stopped generating. */
export type FinishReason = "stop" | "length" | "content_filter" | null;
/** A single completion choice returned by the API. */
export interface Choice {
    /** Zero-based index of this choice. */
    index: number;
    /** The generated message. */
    message: Message;
    /** Why generation stopped for this choice. */
    finish_reason: FinishReason;
}
/** Token usage statistics for the request. */
export interface Usage {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
}
/** Response body from POST /v1/chat/completions. */
export interface ChatResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Choice[];
    usage: Usage;
}
//# sourceMappingURL=types.d.ts.map
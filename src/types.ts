/** The role of a message author in a conversation. */
export type Role = "system" | "user" | "assistant" | "tool";

/** A message from system, user, or assistant (with optional tool calls). */
export interface Message {
  role: Role;
  content: string | null;
  /** Tool calls requested by the assistant. */
  tool_calls?: ToolCall[];
  /** Links a tool result back to the tool call that requested it. */
  tool_call_id?: string;
}

/** A single tool call requested by the model. */
export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    /** JSON-encoded string of the arguments object. */
    arguments: string;
  };
}

/** JSON Schema subset used to describe tool parameters. */
export interface ToolParameters {
  type: "object";
  properties: Record<string, { type: string; description: string }>;
  required?: string[];
}

/** A tool definition sent to the API. */
export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: ToolParameters;
  };
}

/** A tool with its API definition and local execute function. */
export interface Tool {
  definition: ToolDefinition;
  execute: (args: Record<string, unknown>) => Promise<string>;
}

/** Request body for POST /v1/chat/completions. */
export interface ChatRequest {
  /** The model identifier to use for completion. */
  model: string;
  /** The conversation history, in order. */
  messages: Message[];
  /** Tools available to the model. */
  tools?: ToolDefinition[];
  /** If true, stream partial tokens back as server-sent events. */
  stream?: boolean;
  /** Sampling temperature (0–2). Higher = more random. */
  temperature?: number;
  /** Maximum number of tokens to generate. */
  max_tokens?: number;
}

/** Why the model stopped generating. */
export type FinishReason = "stop" | "length" | "content_filter" | "tool_calls" | null;

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

import type { ChatRequest, ChatResponse } from "./types.js";

const API_URL = "http://localhost:1234/v1/chat/completions";
const MODEL = "qwen/qwen3-coder-next";

const request: ChatRequest = {
  model: MODEL,
  messages: [{ role: "user", content: "hello world" }],
};

const response = await fetch(API_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(request),
});

const data = await response.json() as ChatResponse;
console.log(data.choices[0]?.message.content);

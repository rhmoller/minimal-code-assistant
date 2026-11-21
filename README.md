# minimal-code-assistant

A coding agent in about 700 lines of TypeScript, written to show how tools like Claude Code work underneath: a loop around a chat API, plus tools and skills. It's built for learning, not for production use.

**Presentation:** https://rhmoller.github.io/minimal-code-assistant/

## Setup

Requires Node 18+, and [`fzf`](https://github.com/junegunn/fzf) for the `fuzzy_find` tool.

```sh
npm install
npm run build
npm link        # optional: installs the `mca` command
```

Create a `config.json` in the directory you run it from. Any OpenAI-compatible endpoint works, for example a local model in LM Studio:

```json
{
  "defaultModel": "qwen/qwen3.6-35b-a3b",
  "models": [
    { "name": "qwen/qwen3.6-35b-a3b", "baseUrl": "http://localhost:1234/v1/chat/completions" },
    { "name": "gpt-4.1", "baseUrl": "https://api.openai.com/v1/chat/completions", "apiKey": "sk-..." }
  ]
}
```

Each `name` is sent to the API as the model ID, so it must match exactly. The model must support tool calling.

## Usage

Run `mca` (or `npm start`) and chat. Commands: `/model <name>`, `/models`, `/tools`, `/dump` (print the raw message history), `/reset`, `/exit`.

Skills are loaded from `.claude/skills/` and `.agents/skills/`, in both your home directory and the current directory.

> **Warning:** the `bash` tool runs any command the model asks for, with no confirmation. Use it in a throwaway directory or container.

## License

MIT, see [LICENSE](LICENSE).

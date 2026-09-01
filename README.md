# LLM API

> [!IMPORTANT]
> This repository is no longer actively maintained by the LLMAPI team. We will continue to address security issues — we aim to keep this repository free of open security alerts — but no new features, upstream syncs, or general support are planned. Thank you to everyone who has used and contributed to this project.

## Project status

This project began as a fork of [LLM Gateway](https://github.com/theopenco/llmgateway), and we are sincerely grateful to its authors for the open-source foundation their work provided. If you are looking for an actively developed LLM gateway, we encourage you to check out their project.

In early 2026, the repository was temporarily disabled by GitHub in connection with a DMCA notice concerning the upstream project's `ee/` (Enterprise Edition) directory. We believe this was an unfortunate misunderstanding: at the time of our fork, that directory contained only two license text files and no source code, and the enterprise code upstream later added was never part of this fork, which had already diverged. Out of respect for the upstream project's licensing, we removed the directory the same day the notice was filed and later purged it from the repository's entire history. The repository has since been reinstated.

Rather than continue building on this codebase, we have developed our own gateway from the ground up — a completely new project written in Go on our own stack, which shares no code with this repository or its upstream. This repository remains public in the interest of transparency and for anyone who benefits from its AGPLv3-licensed code. We wish the upstream team continued success with their project.

LLM API is an open-source API gateway for Large Language Models (LLMs). It acts as a middleware between your applications and various LLM providers, allowing you to:

- Route requests to multiple LLM providers (OpenAI, Anthropic, Google Vertex AI, and others)
- Manage API keys for different providers in one place
- Track token usage and costs across all your LLM interactions
- Analyze performance metrics to optimize your LLM usage

## Features

- **Unified API Interface**: Compatible with the OpenAI API format for seamless migration
- **Usage Analytics**: Track requests, tokens used, response times, and costs
- **Multi-provider Support**: Connect to various LLM providers through a single gateway
- **Performance Monitoring**: Compare different models' performance and cost-effectiveness

## Getting Started

You can use LLM API in two ways:

- **Hosted Version**: For immediate use without setup, visit [llmapi.ai](https://llmapi.ai) to create an account and get an API key.
- **Self-Hosted**: Deploy LLM API on your own infrastructure for complete control over your data and configuration.

### Using LLM API

```bash
curl -X POST https://internal.llmapi.ai/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LLM_API_KEY" \
  -d '{
  "model": "gpt-4o",
  "messages": [
    {"role": "user", "content": "Hello, how are you?"}
  ]
}'
```

## Development Setup

1. Install dependencies and set up the development environment:

   ```bash
   pnpm i && pnpm run setup
   ```

   This will install all dependencies, start Docker services, sync the database schema, and seed initial data.

   **Note for WSL2 users**: Ensure Docker Desktop is running with WSL integration enabled.

2. Start development servers:

   ```bash
   pnpm dev
   ```

3. Build for production:
   ```bash
   pnpm build
   ```

## Folder Structure

- `apps/ui`: Next.js dashboard frontend
- `apps/playground`: Next.js LLM playground
- `apps/code`: Next.js Dev Plans + coding tools landing & dashboard
- `apps/api`: Hono backend
- `apps/gateway`: API gateway for routing LLM requests
- `apps/docs`: Documentation site
- `apps/admin`: Internal admin dashboard
- `packages/db`: Drizzle ORM schema and migrations
- `packages/models`: Model and provider definitions
- `packages/shared`: Shared types and utilities

## License

LLMAPI is licensed under AGPLv3 - see the [LICENSE](LICENSE) file for details.

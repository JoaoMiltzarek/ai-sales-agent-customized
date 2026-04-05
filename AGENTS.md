# AGENTS.md

## Project overview
AI-powered sales response generator. Users fill a form with business context
and receive a tailored commercial response. Built as a portfolio MVP.

## Stack
- Next.js 14 (App Router, no Pages Router)
- TypeScript (strict mode)
- Tailwind CSS
- Vercel deployment

## Project structure
app/
  api/generate/route.ts   → POST route: receives form data, builds prompt, calls OpenAI
  page.tsx                → Single page: form + result display
lib/
  buildSalesPrompt.ts     → Builds the prompt string from form inputs
  buildFallbackResponse.ts → Returns a local response when OpenAI is unavailable

## Conventions
- No default exports on lib files — use named exports only
- All shared TypeScript types go in lib/types.ts (create if missing)
- Zod schemas go in lib/schemas.ts (create if missing)
- Tests go in lib/*.test.ts using Vitest
- Never expose OPENAI_API_KEY to the client — server only
- Keep all logic inside App Router conventions (no 'use client' on route handlers)

## Commands
- Dev: npm run dev
- Build: npm run build
- Test: npm run test (may not exist yet — create if needed)

## Important constraints
- Do not change the overall page layout or color scheme unless explicitly instructed
- Do not add any new pages or routes unless explicitly instructed
- Do not upgrade Next.js or React versions
- Always run the build after changes to confirm no TypeScript errors
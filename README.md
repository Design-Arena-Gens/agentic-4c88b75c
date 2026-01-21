# Atlas Agent

Atlas is a full-stack Next.js AI agent designed for research, planning, and execution workflows. It provides a conversational interface that returns structured action plans, surface-level insights, confidence scoring, and curated follow-up suggestions for each response.

## Features
- Conversational UI with persistent session context
- OpenAI-powered reasoning with JSON-structured responses
- Automatic plan extraction, insight tags, confidence scoring, and citation support
- Quick prompt launcher and one-tap automation suggestions
- Responsive layout optimized for desktop and mobile

## Tech Stack
- [Next.js 16 (App Router, TypeScript, Tailwind CSS 4)](https://nextjs.org/)
- [OpenAI Responses API](https://api.openai.com/)
- [React Markdown + Remark GFM](https://github.com/remarkjs/react-markdown)
- Styled with modern glassmorphism-inspired components

## Getting Started
1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Configure environment**
   - Copy `.env.example` to `.env.local`
   - Provide an `OPENAI_API_KEY`
   - Optionally set `OPENAI_MODEL` (defaults to `gpt-4.1-mini`)
3. **Run the development server**
   ```bash
   npm run dev
   ```
4. Visit [http://localhost:3000](http://localhost:3000) and start a session with Atlas.

## Available Scripts
- `npm run dev` – start the development server
- `npm run build` – create a production build
- `npm start` – run the production build locally
- `npm run lint` – lint the project using ESLint

## Deployment
This project is optimized for Vercel. After configuring environment variables in the dashboard:
```bash
vercel deploy --prod --yes --token $VERCEL_TOKEN --name agentic-4c88b75c
```

## License
MIT

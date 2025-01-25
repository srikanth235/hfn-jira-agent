<a href="https://hfn-jira-agent.vercel.app/">
<img src="https://github.com/srikanth235/hfn-jira-agent/blob/main/public/images/chat-screenshot.png" alt="Heartfulness Jira Agent" />

  <h1 align="center">Heartfulness Jira Agent</h1>
</a>

<p align="center">
  A chatbot for helping Heartfulness employees at Kanha campus by providing AI-powered answers from closed Jira tickets, making it easier to find solutions to common workplace issues and problems.
</p>

<p align="center">
  <a href="#tech-stack"><strong>Tech Stack</strong></a> ·
  <a href="#approach"><strong>Approach</strong></a> ·
  <a href="#running-locally"><strong>Running locally</strong></a>
</p>
<br/>

## Approach

The application uses advanced Natural Language Processing techniques to provide relevant answers:

1. **Data Preprocessing**
   - JIRA tickets are processed using OpenAI embeddings
   - Each ticket's content is converted into vector representations that capture semantic meaning

2. **Retrieval System**
   - When a user asks a question, the system finds relevant tickets using semantic similarity
   - The embedding-based search ensures contextually appropriate results
   - Similar tickets are retrieved from the vector database

3. **Response Generation**
   - Retrieved tickets are summarized to extract key information
   - The AI generates a coherent response combining relevant information from multiple tickets
   - Responses are tailored to address the specific user query

This approach ensures efficient and accurate retrieval of information from the knowledge base of closed JIRA tickets.

## Tech Stack

- [Next.js](https://nextjs.org)
  - Used to build the web application
- [AI SDK](https://sdk.vercel.ai/docs)
  - Used to generate responses from the LLM.
  - Tool calls are used to get the answers from the Jira tickets
- [shadcn/ui](https://ui.shadcn.com)
  - All UI components are built with [Tailwind CSS](https://tailwindcss.com)
- Data Persistence
  - [Vercel Postgres powered by Neon](https://vercel.com/storage/postgres) for saving chat history and user data
  - [Vercel Blob](https://vercel.com/storage/blob) for storing vector embeddings
- [NextAuth.js](https://github.com/nextauthjs/next-auth)
  - Simple and secure authentication

## Running locally

You will need to use the environment variables [defined in `.env.example`](.env.example) to run the app.


```bash
pnpm install
pnpm dev
```

Your app should now be running on [localhost:3000](http://localhost:3000/).

import { CoreTool } from 'ai';
import { z } from 'zod';
import * as tf from '@tensorflow/tfjs';
import { getPrecomputedEmbeddings } from './ticket-embeddings';
import { openai } from '@ai-sdk/openai';
import { embed } from 'ai';


const jiraSearchSchema = z.object({
  query: z.string().describe('The search query to find relevant JIRA tickets'),
});

export interface JiraTicket {
  id: string;          // maps to "Issue key"
  title: string;       // maps to "Summary"
  url: string;         // will be constructed
  resolution: string;  // maps to "Status"
  description?: string;// maps to "Description"
  created: string;     // maps to "Created"
  updated: string;     // maps to "Updated"
  department?: string; // maps to "Department"
  location?: string;   // maps to "Location"
  priority?: string;   // maps to "Priority"
}

function cosineSimilarity(a: tf.Tensor, b: tf.Tensor): number {
  const dotProduct = tf.sum(tf.mul(a, b));
  const normA = tf.sqrt(tf.sum(tf.square(a)));
  const normB = tf.sqrt(tf.sum(tf.square(b)));
  return dotProduct.div(normA.mul(normB)).dataSync()[0];
}

// Add caching at module level
let rawTicketsCache: any[] | null = null;

async function loadRawTickets() {
  if (!rawTicketsCache) {
    rawTicketsCache = (await import('./jira_tickets.json')).default;
  }
  return rawTicketsCache;
}

// Add cache for transformed tickets
let ticketsCache: JiraTicket[] | null = null;

// Update loadTickets function
async function loadTickets(): Promise<JiraTicket[]> {
  if (!ticketsCache) {
    try {
      const rawTickets = await loadRawTickets();
      ticketsCache = rawTickets.map((ticket: any) => ({
        id: ticket['Issue key'],
        title: ticket['Summary'],
        url: `${process.env.JIRA_BROWSE_URL || 'https://example.atlassian.net'}/browse/${ticket['Issue key']}`,
        resolution: ticket['Status'],
        description: ticket['Description'],
        created: ticket['Created'],
        updated: ticket['Updated'],
        department: ticket['Department'],
        location: ticket['Location'],
        priority: ticket['Priority']
      }));
    } catch (error) {
      console.error('Failed to load tickets:', error);
      return [];
    }
  }
  return ticketsCache;
}

export function searchJiraTickets({ session }: { session: any }): CoreTool<typeof jiraSearchSchema, JiraTicket[]> {
  return {
    parameters: jiraSearchSchema,
    description: 'This tool searches for closed JIRA tickets to help answer common issues or problems faced by users.',
    execute: async (args: z.infer<typeof jiraSearchSchema>) => {
      const startTime = performance.now();
      let result: JiraTicket[];

      try {
        if (!process.env.JIRA_API_ENDPOINT) {
          const embeddingStartTime = performance.now();
          const [tickets, ticketEmbeddings] = await Promise.all([
            loadTickets(),
            getPrecomputedEmbeddings(),
          ]);

          // Generate embedding for the query using OpenAI
          const { embedding: queryEmbedding } = await embed({
            model: openai.embedding('text-embedding-3-small'),
            value: args.query,
          });

          // Calculate similarities using tf.tidy
          const similarities = tf.tidy(() => {
            const queryTensor = tf.tensor2d([queryEmbedding]);
            return ticketEmbeddings.arraySync().map((embedding: number[]) =>
              cosineSimilarity(tf.tensor(embedding), queryTensor.squeeze())
            );
          });

          const embeddingEndTime = performance.now();

          // Sort tickets by similarity score and filter by threshold
          const ticketsWithScores = tickets
            .map((ticket, index) => ({ ticket, similarity: similarities[index] }))
            .filter(item => item.similarity != null && !isNaN(item.similarity))
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 5);

          result = ticketsWithScores.map(item => item.ticket);

          console.log({
            operation: 'searchJiraTickets:file',
            embeddingTime: embeddingEndTime - embeddingStartTime,
            totalTime: performance.now() - startTime,
          });
        } else {
          const apiStartTime = performance.now();
          const jql = encodeURIComponent(`resolution IS NOT EMPTY AND text ~ "${args.query}"`);
          const response = await fetch(
            `${process.env.JIRA_API_ENDPOINT}/search?jql=${jql}&maxResults=5`,
            {
              headers: {
                Authorization: `Bearer ${process.env.JIRA_API_TOKEN}`,
                'Content-Type': 'application/json',
              },
            }
          );

          const data = await response.json();
          result = data.issues.map((issue: any) => ({
            id: issue.key,
            title: issue.fields.summary,
            url: `${process.env.JIRA_BROWSE_URL || process.env.JIRA_API_ENDPOINT}/browse/${issue.key}`,
            resolution: issue.fields.resolution.name,
          }));

          console.log({
            operation: 'searchJiraTickets:jira',
            apiTime: performance.now() - apiStartTime,
            totalTime: performance.now() - startTime,
          });
        }

        return result;
      } catch (error) {
        const endTime = performance.now();
        console.error('Failed to search JIRA tickets:', error, {
          operation: 'searchJiraTickets:error',
          totalTime: endTime - startTime,
        });
        return [];
      }
    }
  };
}


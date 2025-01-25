import * as tf from '@tensorflow/tfjs';
import { openai } from '@ai-sdk/openai';
import { embedMany } from 'ai';
import { JiraTicket } from './search-jira-tickets';
import { put, list } from '@vercel/blob';
import ticketData from './jira_tickets.json';

let precomputedTicketEmbeddings: tf.Tensor2D | null = null;
let cachedTickets: JiraTicket[] | null = null;

function loadTickets(): JiraTicket[] {
  if (!cachedTickets) {
    cachedTickets = ticketData.map(ticket => ({
      id: ticket['Issue key'],
      title: ticket['Summary'],
      description: ticket['Description'],
      department: ticket['Department'],
      location: ticket['Location'],
      resolution: ticket['Status'],
      url: `https://jira.example.com/browse/${ticket['Issue key']}`,
      created: ticket['Created'],
      updated: ticket['Updated']
    }));
  }
  return cachedTickets;
}

async function storeEmbeddingsInBlob(embeddings: tf.Tensor2D) {
  try {
    const embeddingsArray = await embeddings.array();
    const { url } = await put('ticket-embeddings.json', JSON.stringify(embeddingsArray), {
      access: 'public',
      addRandomSuffix: false
    });
    console.log('Successfully saved embeddings to Blob:', url);
  } catch (error) {
    console.error('Failed to save embeddings to Blob:', error);
    throw error;
  }
}

async function loadEmbeddingsFromBlob(): Promise<tf.Tensor2D | null> {
  try {
    const { blobs } = await list();
    const embeddingBlob = blobs.find(blob => blob.pathname === 'ticket-embeddings.json');

    if (!embeddingBlob) {
      console.log('No embeddings found in Blob storage');
      return null;
    }

    console.log('Loading embeddings from Blob:', embeddingBlob.url);
    const response = await fetch(embeddingBlob.url);
    const embeddingsArray = await response.json();
    return tf.tensor2d(embeddingsArray);
  } catch (error) {
    console.error('Error loading embeddings from Blob:', error);
    return null;
  }
}

function getTicketText(ticket: JiraTicket): string {
  return JSON.stringify({
    title: ticket.title,
    description: ticket.description,
    department: ticket.department,
    location: ticket.location,
    resolution: ticket.resolution
  });
}

export async function getPrecomputedEmbeddings() {
  if (!precomputedTicketEmbeddings) {
    // Try to load from Blob storage first
    precomputedTicketEmbeddings = await loadEmbeddingsFromBlob();

    // If not found in Blob storage, compute and save
    if (!precomputedTicketEmbeddings) {
      const tickets = loadTickets();
      const { embeddings } = await embedMany({
        model: openai.embedding('text-embedding-3-small'),
        values: tickets.map(ticket => getTicketText(ticket)),
      });
      precomputedTicketEmbeddings = tf.tensor2d(embeddings);
      await storeEmbeddingsInBlob(precomputedTicketEmbeddings);
    }
  }
  return precomputedTicketEmbeddings;
}
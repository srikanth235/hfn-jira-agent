import * as tf from '@tensorflow/tfjs';
import * as use from '@tensorflow-models/universal-sentence-encoder';
import { JiraTicket } from './search-jira-tickets';
import * as fs from 'fs';
import * as path from 'path';
import ticketData from './jira_tickets.json';

const EMBEDDINGS_FILE_PATH = path.join(
  process.env.HOME || process.env.USERPROFILE || '',
  'ticket-embeddings.json'
);

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

async function saveEmbeddingsToFile(embeddings: tf.Tensor2D) {
  try {
    const embeddingsDir = path.dirname(EMBEDDINGS_FILE_PATH);

    // Check if directory exists before creating
    try {
      await fs.promises.access(embeddingsDir);
      console.log('Directory already exists:', embeddingsDir);
    } catch {
      console.log('Creating directory:', embeddingsDir);
      await fs.promises.mkdir(embeddingsDir, { recursive: true });
    }

    const embeddingsArray = await embeddings.array();
    console.log('Writing embeddings to:', EMBEDDINGS_FILE_PATH);
    await fs.promises.writeFile(EMBEDDINGS_FILE_PATH, JSON.stringify(embeddingsArray));
    console.log('Successfully saved embeddings');
  } catch (error) {
    console.error('Failed to save embeddings:', error);
    throw error;
  }
}

async function loadEmbeddingsFromFile(): Promise<tf.Tensor2D | null> {
  try {
    console.log('Attempting to load embeddings from:', EMBEDDINGS_FILE_PATH);
    await fs.promises.access(EMBEDDINGS_FILE_PATH);
    const data = await fs.promises.readFile(EMBEDDINGS_FILE_PATH, 'utf8');
    console.log('Successfully loaded embeddings file');
    const embeddingsArray = JSON.parse(data);
    return tf.tensor2d(embeddingsArray);
  } catch (error) {
    console.error('Error loading embeddings:', error);
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
    // Try to load from file first
    precomputedTicketEmbeddings = await loadEmbeddingsFromFile();

    // If not found in file, compute and save
    if (!precomputedTicketEmbeddings) {
      const model = await use.load();
      const tickets = loadTickets();
      // Use all relevant fields for embedding
      precomputedTicketEmbeddings = await model.embed(
        tickets.map(ticket => getTicketText(ticket))
      ) as unknown as tf.Tensor2D;
      await saveEmbeddingsToFile(precomputedTicketEmbeddings);
    }
  }
  return precomputedTicketEmbeddings;
}
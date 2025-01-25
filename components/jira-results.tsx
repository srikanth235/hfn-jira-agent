import { ExternalLinkIcon, DotsIcon } from './icons';
import Image from 'next/image';

interface JiraTicket {
  id: string;
  title: string;
  url: string;
  resolution: string;
}

interface Source {
  title: string;
  publisher: string;
  logo: string;
  url: string;
}

interface JiraResultsProps {
  tickets?: JiraTicket[];
  isLoading?: boolean;
  sources?: Source[];
}

export function JiraResults({ tickets, isLoading, sources }: JiraResultsProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border bg-gray-200 dark:bg-gray-800 p-4">
        <div className="animate-pulse">
          <div className="h-4 w-1/3 bg-gray-300 dark:bg-gray-700 rounded mb-3" />
          <div className="h-3 w-full bg-gray-300 dark:bg-gray-700 rounded mb-2" />
          <div className="h-3 w-2/3 bg-gray-300 dark:bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  if (!tickets?.length) return null;

  return (
    <div className="rounded-lg border bg-gray-100 dark:bg-gray-900 p-4 space-y-6">
      {/* JIRA Tickets as Sources Section */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        {tickets.map(ticket => (
          <a
            key={ticket.id}
            href={ticket.url}
            target="_blank"
            rel="noopener noreferrer"
            className="relative flex flex-col min-w-[300px] p-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            <ExternalLinkIcon size={4} />
            <h4 className="font-semibold text-gray-800 dark:text-gray-200">{ticket.id}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">{ticket.title}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{ticket.resolution}</p>
          </a>
        ))}
      </div>

      
    </div>
  );
}
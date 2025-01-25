import { ExternalLinkIcon, DotsIcon } from './icons';
import Image from 'next/image';
import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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

  const initialTickets = tickets.slice(0, 3);
  const remainingTickets = tickets.slice(3);

  const TicketCard = ({ ticket }: { ticket: JiraTicket }) => (
    <a
      href={ticket.url}
      target="_blank"
      rel="noopener noreferrer"
      className="relative flex flex-col min-w-[200px] p-3 bg-gray-100 dark:bg-muted rounded-lg hover:bg-gray-50 dark:hover:bg-muted/80 transition"
    >
      <div className="absolute top-3 right-3">
        <ExternalLinkIcon size={16} className="text-gray-500 dark:text-gray-400" />
      </div>
      <h4 className="text-sm font-medium text-gray-800 dark:text-gray-100">{ticket.id}</h4>
      <p className="text-xs text-gray-700 dark:text-gray-400">{ticket.title}</p>
      <p className="text-xs text-gray-700 dark:text-gray-400">{ticket.resolution}</p>
    </a>
  );

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 space-y-6">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-track-transparent dark:scrollbar-thumb-gray-600 scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500">
        {initialTickets.map(ticket => (
          <TicketCard key={ticket.id} ticket={ticket} />
        ))}

        {remainingTickets.length > 0 && (
          <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <Dialog.Trigger asChild>
              <button className="relative flex flex-col min-w-[200px] p-3 bg-gray-100 dark:bg-muted rounded-lg hover:bg-gray-50 dark:hover:bg-muted/80 transition items-center justify-center">
                <span className="text-sm font-medium">View {remainingTickets.length} More</span>
                <DotsIcon size={16}   />
              </button>
            </Dialog.Trigger>

            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-overlayShow" />
              <Dialog.Content className="fixed left-1/2 top-1/2 max-h-[85vh] w-[90vw] max-w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white dark:bg-sidebar p-6 shadow-lg focus:outline-none data-[state=open]:animate-contentShow overflow-y-auto">
                <Dialog.Title className="text-lg font-semibold mb-4">All Related Tickets</Dialog.Title>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tickets.map(ticket => (
                    <TicketCard key={ticket.id} ticket={ticket} />
                  ))}
                </div>

                <Dialog.Close asChild>
                  <button
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                    aria-label="Close"
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 15 15"
                      fill="none"
                      className="size-4"
                    >
                      <path
                        d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
                        fill="currentColor"
                      />
                    </svg>
                  </button>
                </Dialog.Close>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        )}
      </div>
    </div>
  );
}
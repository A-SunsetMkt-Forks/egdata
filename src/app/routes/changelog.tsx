import { ArrowRightIcon, ChevronRightIcon } from '@radix-ui/react-icons';
import { dehydrate, HydrationBoundary, keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '~/components/ui/collapsible';
import { Input } from '~/components/ui/input';
import { client, getQueryClient } from '~/lib/client';
import { cn } from '~/lib/utils';
import type { SingleItem } from '~/types/single-item';
import type { SingleOffer } from '~/types/single-offer';
import {
  Pagination,
  PaginationButton,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNextButton,
  PaginationPreviousButton,
} from '~/components/ui/pagination';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { type ClientLoaderFunctionArgs, Link, useLoaderData } from '@remix-run/react';

export interface Root {
  hits: (OfferHit | ItemHit | AssetHit | Hit)[];
  query: string;
  processingTimeMs: number;
  limit: number;
  offset: number;
  estimatedTotalHits: number;
}

interface DefaultHit {
  _id: string;
  timestamp: string;
  metadata: Metadata;
}

interface Metadata {
  changes: Change[];
  contextId: string;
  contextType: string;
}

interface Change {
  changeType: string;
  field: string;
  newValue: unknown;
  oldValue: unknown;
}

interface OfferHit extends DefaultHit {
  metadata: Metadata & { contextType: 'offer' };
  document: SingleOffer;
}

interface ItemHit extends DefaultHit {
  metadata: Metadata & { contextType: 'item' };
  document: SingleItem;
}

interface AssetHit extends DefaultHit {
  metadata: Metadata & { contextType: 'asset' };
  document: SingleItem;
}

interface Hit {
  _id: string;
  timestamp: string;
  metadata: Metadata;
  document: null;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const queryClient = getQueryClient();
  const url = new URL(request.url);
  const query = url.searchParams.get('query') || '';
  const page = Number(url.searchParams.get('page')) || 1;

  await queryClient.prefetchQuery({
    queryKey: [
      'changelogs',
      {
        query,
        page,
      },
    ],
    queryFn: () =>
      client
        .get<Root>('/search/changelog', {
          params: {
            query,
            page,
          },
        })
        .then((res) => res.data),
  });

  return {
    page,
    query,
    dehydratedState: dehydrate(queryClient),
  };
}

export async function clientLoader({ request }: ClientLoaderFunctionArgs) {
  const queryClient = getQueryClient();
  const url = new URL(request.url);
  const query = url.searchParams.get('query') || '';
  const page = Number(url.searchParams.get('page')) || 1;

  await queryClient.prefetchQuery({
    queryKey: [
      'changelogs',
      {
        query,
        page,
      },
    ],
    queryFn: () =>
      client
        .get<Root>('/search/changelog', {
          params: {
            query,
            page,
          },
        })
        .then((res) => res.data),
  });

  return {
    page,
    query,
    dehydratedState: dehydrate(queryClient),
  };
}

export default function Index() {
  const { dehydratedState } = useLoaderData<typeof loader>();
  return (
    <HydrationBoundary state={dehydratedState}>
      <ChangelogPage />
    </HydrationBoundary>
  );
}

const MAX_PAGES_DISPLAY = 5;

export function ChangelogPage() {
  const { page: initialPage, query: initialQuery } = useLoaderData<typeof loader>();
  const [page, setPage] = useState(initialPage || 1);
  const [query, setQuery] = useState(initialQuery || '');
  const { data, isLoading, isError } = useQuery({
    queryKey: [
      'changelogs',
      {
        query,
        page,
      },
    ],
    queryFn: () =>
      client
        .get<Root>('/search/changelog', {
          params: {
            query,
            page,
          },
        })
        .then((res) => res.data),
    refetchOnMount: false,
    placeholderData: keepPreviousData,
  });

  const handlePageChange = (newPage: number) => {
    setPage(newPage);

    // Add query params to URL
    const url = new URL(window.location.href);
    url.searchParams.set('page', newPage.toString());
    url.searchParams.set('query', query);
    window.history.pushState({}, '', url.toString());
  };

  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery);
    setPage(1);

    // Add query params to URL
    const url = new URL(window.location.href);
    url.searchParams.set('page', '1');
    url.searchParams.set('query', newQuery);
    window.history.pushState({}, '', url.toString());
  };

  const totalPages = Math.ceil((data?.estimatedTotalHits || 0) / (data?.limit || 1));

  const startPage = Math.max(1, page - Math.floor(MAX_PAGES_DISPLAY / 2));
  const endPage = Math.min(totalPages, startPage + MAX_PAGES_DISPLAY - 1);

  const pageNumbers = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto px-4 py-8 sm:px-6">
      <div className="flex items-center gap-4">
        <Input
          type="search"
          placeholder="Search changelogs..."
          className="flex-1 bg-background"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
        />
        <Button>Search</Button>
      </div>
      <div className="grid gap-4">
        {isLoading && <div>Loading...</div>}
        {isError && <div>Error fetching data</div>}
        {data?.hits.map((hit) => (
          <ChangelogItem key={hit._id} hit={hit} query={query} />
        ))}
      </div>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPreviousButton
              onClick={() => {
                handlePageChange(page - 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={page <= 1}
            />
          </PaginationItem>
          {pageNumbers.map((pageNumber) => (
            <PaginationItem key={pageNumber}>
              <PaginationButton
                onClick={() => {
                  handlePageChange(pageNumber);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={page === pageNumber}
              >
                {pageNumber}
              </PaginationButton>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNextButton
              onClick={() => {
                handlePageChange(page + 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={page >= totalPages}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

function ChangelogItem({
  hit,
  query,
}: { hit: OfferHit | ItemHit | AssetHit | Hit; query: string }) {
  const [open, setOpen] = useState(false);
  const title = hit.document?.title || hit.metadata.contextId;

  return (
    <Collapsible>
      <CollapsibleTrigger
        className="flex items-start gap-4 p-4 rounded-lg bg-muted hover:bg-muted/50 transition-colors w-full cursor-pointer"
        asChild
        onClick={() => setOpen((open) => !open)}
        value={open as unknown as string}
      >
        <div className="flex items-start gap-4 w-full">
          <div className="flex-1 grid gap-2">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{ValueToString(title, query)}</h3>
              <Badge variant="secondary" className="text-xs">
                {hit.metadata.contextType}
              </Badge>
            </div>
            <p className="text-muted-foreground">{hit.metadata.changes.length} changes</p>
            <div className="text-xs text-muted-foreground">
              {new Date(hit.timestamp).toLocaleString('en-UK', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                second: 'numeric',
              })}
            </div>
          </div>

          <ChevronRightIcon
            className={cn(
              'w-5 h-5 text-muted-foreground transition-transform ease-in-out duration-200',
              open ? 'transform rotate-90' : 'transform rotate-0',
            )}
          />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="w-full max-w-5xl">
        <div className="p-4">
          <div className="text-muted-foreground flex items-start w-full gap-2 flex-col">
            {hit.metadata.changes.map((change) => (
              <div
                key={change.field}
                className="grid gap-2 border border-muted/50 p-4 rounded-lg w-full"
              >
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{ValueToString(change.field, query)}</h4>
                  <Badge variant="secondary" className="text-xs">
                    {change.changeType}
                  </Badge>
                </div>
                <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 relative mt-2">
                  <div className="pr-2 flex flex-col gap-1 items-center justify-center">
                    <span className="text-muted-foreground">
                      {ValueToString(change.oldValue, query, change.field)}
                    </span>
                  </div>
                  <div className="pl-8 flex flex-col gap-1 items-center justify-center">
                    <span className="text-muted-foreground">
                      {ValueToString(change.newValue, query, change.field)}
                    </span>
                  </div>
                  <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <ArrowRightIcon className="size-6 text-muted-foreground" />
                  </span>
                </div>
              </div>
            ))}
          </div>
          {(hit.metadata.contextType === 'offer' || hit.metadata.contextType === 'item') && (
            <Link
              to={`/${hit.metadata.contextType}s/${hit.metadata.contextId}`}
              className="w-full bg-card p-4 rounded-lg mt-4 block"
            >
              View {hit.metadata.contextType}
            </Link>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function ValueToString(value: unknown, query: string, field?: string) {
  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? <mark key={i}>{part}</mark> : part,
    );
  };

  if (field === 'keyImages' && value !== null) {
    const typedValue = value as { url: string; md5: string; type: string };
    return (
      <div className="flex items-center justify-center gap-2">
        <img
          src={typedValue.url}
          alt={typedValue.md5}
          className="w-1/2 h-auto object-cover rounded-lg"
        />
      </div>
    );
  }

  if (field?.includes('Date') && typeof value === 'string') {
    return new Date(value).toLocaleString('en-UK', {
      weekday: undefined,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    });
  }

  if (field === 'tags' && value !== null) {
    const typedValue = value as { id: string; name: string };
    return <span className="font-medium">{typedValue.name}</span>;
  }

  if (typeof value === 'number') {
    return value.toLocaleString();
  }

  if (typeof value === 'string') {
    return <>{highlightText(value, query)}</>;
  }

  if (typeof value === 'object') {
    return (
      <pre>
        <code>{highlightText(JSON.stringify(value, null, 2), query)}</code>
      </pre>
    );
  }

  return value?.toString() || 'N/A';
}

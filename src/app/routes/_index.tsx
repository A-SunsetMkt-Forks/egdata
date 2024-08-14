import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import type { FullTag } from '~/types/tags';
import type { SingleOffer } from '~/types/single-offer';
import type { GiveawayOffer } from '~/types/giveaways';
import { useLoaderData } from '@remix-run/react';
import { getQueryClient } from '~/lib/client';
import cookie from 'cookie';
import { useCookies } from 'react-cookie';
import { SalesModule } from '~/components/modules/sales';
import { ChangelistModule } from '~/components/modules/changelist';
import { FeaturedModule } from '~/components/modules/featured';
import { UpcomingOffers } from '~/components/modules/upcoming';
import { StatsModule } from '~/components/modules/stats';
import { TopSection } from '~/components/modules/top-section';
import { FeaturedDiscounts } from '~/components/modules/featured-discounts';
import getCountryCode from '~/lib/get-country-code';
import { UpcomingCalendar } from '~/components/modules/upcoming-calendar';
import { GamesWithAchievements } from '~/components/modules/achievements-blade';
import { GiveawaysCarousel } from '~/components/modules/giveaways';
import { LatestOffers } from '~/components/modules/latest-offers';
import { LastModifiedGames } from '~/components/modules/last-modified-offers';
import { useState } from 'react';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getFeaturedDiscounts } from '~/queries/featured-discounts';
import { getTopSection } from '~/queries/top-section';
import { getLastModified } from '~/queries/last-modified';
import { httpClient } from '~/lib/http-client';

export const meta: MetaFunction = () => {
  return [
    { title: 'egdata.app' },
    {
      name: 'description',
      content:
        'Epic Games database with all the information you need about the games, items, and events.',
    },
    {
      name: 'keywords',
      content:
        'epic games, fortnite, database, api, epic games api, egdata, epic games store, egstore, epic online services, eos',
    },
  ];
};

type preferencesCookie = {
  order: string[];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const queryClient = getQueryClient();
  const url = new URL(request.url);
  let cookieHeader = request.headers.get('Cookie');
  if (typeof cookieHeader !== 'string') {
    cookieHeader = '';
  }
  const country = getCountryCode(url, cookie.parse(request.headers.get('Cookie') || ''));
  const userPrefsCookie = cookie.parse(cookieHeader as string).EGDATA_USER_PREFS as string;
  const userPrefs = JSON.parse(userPrefsCookie || '{}') as preferencesCookie;

  const [latestGames, featuredGames, eventsData, giveawaysData] = await Promise.allSettled([
    queryClient.fetchQuery({
      queryKey: ['latest-games'],
      queryFn: () =>
        httpClient
          .get<SingleOffer[]>('/latest-games', {
            params: {
              country,
            },
          })
          .catch((error) => {
            console.error('Failed to fetch latest games', error);
            return [] as SingleOffer[];
          }),
    }),
    queryClient.fetchQuery({
      queryKey: ['featured'],
      queryFn: () =>
        httpClient
          .get<SingleOffer[]>('/featured', {
            params: {
              country,
            },
          })
          .catch((error) => {
            console.error('Failed to fetch featured game', error);
            return [];
          }),
    }),
    queryClient.fetchQuery({
      queryKey: ['promotions'],
      queryFn: () =>
        httpClient.get<FullTag[]>('/promotions').catch((error) => {
          console.error('Failed to fetch events', error);
          return { data: [] as FullTag[] };
        }),
    }),
    queryClient.fetchQuery({
      queryKey: ['giveaways'],
      queryFn: () =>
        httpClient
          .get<GiveawayOffer[]>('/free-games', {
            params: {
              country,
            },
          })
          .catch((error) => {
            console.error('Failed to fetch giveaways', error);
            return [] as GiveawayOffer[];
          }),
    }),
    queryClient.prefetchQuery({
      queryKey: ['featuredDiscounts', { country }],
      queryFn: () => getFeaturedDiscounts({ country }),
      staleTime: 6000,
    }),
    queryClient.prefetchQuery({
      queryKey: ['top-section', { slug: 'top-wishlisted' }],
      queryFn: () => getTopSection('top-wishlisted'),
    }),
    queryClient.prefetchQuery({
      queryKey: ['top-section', { slug: 'top-sellers' }],
      queryFn: () => getTopSection('top-sellers'),
    }),
    queryClient.prefetchQuery({
      queryKey: ['last-modified-offers', { country }],
      queryFn: () => getLastModified(country),
    }),
  ]);

  const games = latestGames.status === 'fulfilled' ? latestGames.value : [];
  const featured = featuredGames.status === 'fulfilled' ? featuredGames.value : [];
  const events = eventsData.status === 'fulfilled' ? eventsData.value : [];
  const giveaways = giveawaysData.status === 'fulfilled' ? giveawaysData.value : [];

  const dehydratedState = dehydrate(queryClient);

  return {
    games: games as SingleOffer[],
    featured: featured as SingleOffer[],
    events: events as FullTag[],
    giveaways: giveaways as GiveawayOffer[],
    userPrefs: userPrefs,
    dehydratedState: dehydratedState,
  };
};

type LoaderData = ReturnType<typeof loader>;

const defaultOrder = [
  'featuredDiscounts',
  // 'featured',
  'giveaways',
  'latest',
  'upcomingCalendar',
  'upcomingOffers',
  'lastModified',
  'topWishlisted',
  // 'summerSale',
  'statsCombined',
  'achievements',
  'topSeller',
  'event1',
  'event2',
  'event3',
];

export default function Index() {
  const [, setCookies] = useCookies(['EGDATA_USER_PREFS']);
  const { games, featured, events, giveaways, userPrefs, dehydratedState } =
    useLoaderData<LoaderData>();
  const [order, setOrder] = useState(userPrefs.order || defaultOrder);

  const sections = [
    { key: 'featured', component: <FeaturedModule key={'featured'} offers={featured} /> },
    {
      key: 'giveaways',
      component: <GiveawaysCarousel key={'giveaways'} initialData={giveaways} />,
    },
    { key: 'latest', component: <LatestOffers key={'latest'} offers={games} /> },
    { key: 'featuredDiscounts', component: <FeaturedDiscounts key={'featuredDiscounts'} /> },
    { key: 'lastModified', component: <LastModifiedGames key={'lastModified'} /> },
    { key: 'upcomingCalendar', component: <UpcomingCalendar key={'upcomingCalendar'} /> },
    { key: 'upcomingOffers', component: <UpcomingOffers key={'upcomingOffers'} /> },
    {
      key: 'summerSale',
      component: <SalesModule key={'summerSale'} event="Summer Sale" eventId="16979" />,
    },
    {
      key: 'statsCombined',
      component: (
        <section
          key={'statsCombined'}
          className="w-full flex md:flex-row justify-between gap-10 flex-col"
        >
          <StatsModule />
          <ChangelistModule />
        </section>
      ),
    },
    {
      key: 'topWishlisted',
      component: (
        <TopSection
          key={'topWishlisted'}
          slug="top-wishlisted"
          title="Most Anticipated"
          side="right"
        />
      ),
    },
    { key: 'achievements', component: <GamesWithAchievements key={'achievements'} /> },
    {
      key: 'event1',
      component: <SalesModule key={'event1'} event={events[0].name} eventId={events[0].id} />,
    },
    {
      key: 'topSeller',
      component: <TopSection key={'topSeller'} slug="top-sellers" title="Top Seller" side="left" />,
    },
    {
      key: 'event2',
      component: (
        <SalesModule key={'event2'} event={'Borderlands Franchise Sale'} eventId={'38257'} />
      ),
    },
    {
      key: 'event3',
      component: <SalesModule key={'event3'} event={events[2].name} eventId={events[2].id} />,
    },
  ];

  const orderedSections = defaultOrder.map((key) =>
    sections.find((section) => section.key === key),
  );

  const handleOrderChange = (newOrder: string[]) => {
    setOrder(newOrder);
    const newCookie = { order: newOrder };
    setCookies('EGDATA_USER_PREFS', JSON.stringify(newCookie), { maxAge: 31_536_000 });
  };

  return (
    <HydrationBoundary state={dehydratedState}>
      <main className="flex flex-col items-center justify-start h-full gap-5 p-4">
        {orderedSections.map((section) => section?.component)}
      </main>
    </HydrationBoundary>
  );
}

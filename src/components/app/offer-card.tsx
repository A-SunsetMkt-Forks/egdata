import { Link } from '@remix-run/react';
import { Image } from './image';
import { Card, CardContent, CardHeader } from '../ui/card';
import type { SingleOffer } from '../modules/sales';
import { getImage } from '~/lib/getImage';

export function GameCard({ game }: { game: SingleOffer }) {
  const fmt = Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: game.price?.currency || 'USD',
  });

  return (
    <Link to={`/offers/${game.id}`} prefetch="viewport">
      <Card className="w-full max-w-sm rounded-lg overflow-hidden shadow-lg">
        <CardHeader className="p-0 rounded-t-xl">
          <Image
            src={getImage(game.keyImages, ['OfferImageTall', 'Thumbnail']).url}
            alt={game.title}
            width={400}
            height={500}
            className="w-full h-96 object-cover hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </CardHeader>
        <CardContent className="p-4 flex-grow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold max-w-xs truncate">{game.title}</h3>
          </div>
          <div className="mt-2 flex items-end justify-between gap-2 h-full">
            <span className="text-sm text-gray-600 dark:text-gray-400">{game.seller.name}</span>
            {game.price && (
              <div className="flex items-center gap-2">
                {game.price.totalPrice.discount > 0 && (
                  <span className="text-gray-500 line-through dark:text-gray-400">
                    {fmt.format(game.price.totalPrice.originalPrice / 100)}
                  </span>
                )}
                <span className="text-primary font-semibold">
                  {fmt.format(game.price.totalPrice.discountPrice / 100)}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

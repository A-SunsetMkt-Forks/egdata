import { Link } from '@remix-run/react';
import { Image } from './image';
import { Card, CardContent, CardHeader } from '../ui/card';
import { getImage } from '~/lib/getImage';
import { Skeleton } from '../ui/skeleton';
import type { SingleOffer } from '~/types/single-offer';
import { offersDictionary } from '~/lib/offers-dictionary';
import { StarIcon } from '@radix-ui/react-icons';
import { useEffect, useState } from 'react';
import { useGenres } from '~/hooks/use-genres';
import { cn } from '~/lib/utils';

export function GameCard({ offer }: { offer: SingleOffer }) {
  const fmt = Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: offer.price?.price.currencyCode || 'USD',
  });

  const isReleased = offer.releaseDate ? new Date(offer.releaseDate) < new Date() : false;
  const isPreOrder = offer.prePurchase;
  const isFree = offer.price?.price.discountPrice === 0;

  return (
    <Link to={`/offers/${offer.id}`} prefetch="viewport">
      <Card className="w-full max-w-sm rounded-lg overflow-hidden shadow-lg relative">
        <CardHeader className="p-0 rounded-t-xl relative">
          <Image
            src={
              getImage(offer.keyImages, [
                'OfferImageTall',
                'Thumbnail',
                'DieselGameBoxTall',
                'DieselStoreFrontTall',
              ])?.url
            }
            quality="medium"
            alt={offer.title}
            width={400}
            height={500}
            className="w-full h-96 object-cover hover:scale-105 transition-transform duration-300 relative"
            loading="lazy"
          />
          {offer.offerType && (
            <span className="absolute -top-1.5 right-0 bg-gray-500/40 py-2 px-3 justify-center items-center text-white backdrop-blur-sm text-xs font-bold rounded-bl-xl z-10 bg-opacity-40">
              {offersDictionary[offer.offerType]}
            </span>
          )}
        </CardHeader>
        <CardContent className="p-4 flex-grow flex flex-col gap-1 justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold max-w-xs truncate">{offer.title}</h3>
          </div>
          <div className="flex flex-row justify-between items-end gap-1 h-full">
            <span className="text-sm text-gray-600 dark:text-gray-400 text-left truncate items-end flex-1">
              {offer.seller.name}
            </span>
            <div className="inline-flex justify-end items-center flex-0">
              {isReleased && offer.price && (
                <div className="flex items-center gap-2 text-right w-full justify-end">
                  {offer.price.price.discount > 0 && (
                    <span className="text-gray-500 line-through dark:text-gray-400">
                      {fmt.format(offer.price.price.originalPrice / 100)}
                    </span>
                  )}
                  <span className="text-primary font-semibold">
                    {isFree ? 'Free' : fmt.format(offer.price.price.discountPrice / 100)}
                  </span>
                </div>
              )}
              {!isReleased && isPreOrder && (
                <div className="flex items-center gap-2 text-right w-full justify-end">
                  <span className="text-primary font-semibold">
                    {fmt.format(offer.price.price.discountPrice / 100)}
                  </span>
                </div>
              )}
              {!isReleased && !isPreOrder && !offer.price && (
                <span className="text-primary font-semibold text-right">Coming Soon</span>
              )}
              {!isReleased &&
                !isPreOrder &&
                offer.price &&
                offer.price.price.discountPrice !== 0 && (
                  <div className="flex items-center gap-2 text-right w-full justify-end">
                    <span className="text-primary font-semibold">
                      {fmt.format(offer.price.price.discountPrice / 100)}
                    </span>
                  </div>
                )}
              {!isReleased &&
                !isPreOrder &&
                offer.price &&
                offer.price.price.discountPrice === 0 && (
                  <span className="text-primary font-semibold text-xs text-right">Coming Soon</span>
                )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function GameCardSkeleton() {
  return (
    <Card className="w-full max-w-sm rounded-lg overflow-hidden shadow-lg">
      <CardHeader className="p-0 rounded-t-xl">
        <Skeleton className="w-full h-72" />
      </CardHeader>
      <CardContent className="p-4 flex-grow flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <Skeleton className="w-3/4 h-6" />
        </div>
        <div className="mt-2 flex items-end justify-between gap-2 h-full">
          <Skeleton className="w-1/2 h-4" />
          <Skeleton className="w-1/4 h-4" />
        </div>
      </CardContent>
    </Card>
  );
}

const GRADIENT_TRANSITION_POINT = 0.1;
const NUM_STEPS = 10;
const GRADIENT_END_POINT = 0.8;

// Cubic easing function
const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
};

const extractGradient = (imageSrc: string): Promise<string> => {
  return new Promise((resolve) => {
    const imgUrl = new URL(imageSrc);
    imgUrl.searchParams.set('w', '1');
    imgUrl.searchParams.set('h', '1');
    imgUrl.searchParams.set('resize', '1');
    const img = new window.Image();
    img.crossOrigin = 'Anonymous';
    img.src = imgUrl.toString();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0, img.width, img.height);
      const imageData = ctx.getImageData(0, 0, img.width, img.height).data;
      let r = 0;
      let g = 0;
      let b = 0;
      const pixelCount = img.width * img.height;

      for (let i = 0; i < pixelCount * 4; i += 4) {
        r += imageData[i];
        g += imageData[i + 1];
        b += imageData[i + 2];
      }

      r = Math.floor(r / pixelCount);
      g = Math.floor(g / pixelCount);
      b = Math.floor(b / pixelCount);

      const color = { r, g, b };
      const startColor = `rgba(${color.r}, ${color.g}, ${color.b}, 1)`;
      const endColor = 'rgba(0, 0, 0, 0)'; // Fully transparent

      // Generate gradient steps
      let gradientSteps = `${startColor} 0%, `;
      for (let i = 1; i <= NUM_STEPS; i++) {
        const t = i / NUM_STEPS;
        const easedT = easeInOutCubic(t);
        const opacity = 1 - easedT;
        gradientSteps += `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity}) ${GRADIENT_TRANSITION_POINT * 100 + (i * ((GRADIENT_END_POINT - GRADIENT_TRANSITION_POINT) * 100)) / NUM_STEPS}%, `;
      }
      gradientSteps += `${endColor} ${GRADIENT_END_POINT * 100}%, ${endColor} 100%`;

      const gradient = `radial-gradient(ellipse at center top, ${gradientSteps})`;

      resolve(gradient);
    };
  });
};

const textSizes = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
};

export function OfferCard({
  offer,
  size = 'xl',
}: { offer: SingleOffer; size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' }) {
  const { genres } = useGenres();
  const [gradient, setGradient] = useState<string | null>(null);
  const fmt = Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: offer.price?.price.currencyCode || 'USD',
  });

  const isReleased = offer.releaseDate ? new Date(offer.releaseDate) < new Date() : false;
  const isPreOrder = offer.prePurchase;
  const isFree = offer.price?.price.discountPrice === 0;

  const offerGenres = genres
    ? offer.tags
        .filter((tag) => genres?.map((genre) => genre?.id).includes(tag?.id))
        .map((tag) => tag.name)
    : [];

  useEffect(() => {
    if (offer.keyImages.length > 0) {
      extractGradient(
        getImage(offer.keyImages, [
          'OfferImageTall',
          'Thumbnail',
          'DieselGameBoxTall',
          'DieselStoreFrontTall',
        ])?.url ?? 'https://via.placeholder.com/400x550',
      ).then((result) => {
        setGradient(result);
      });
    }
  }, [offer.keyImages]);

  return (
    <Link to={`/offers/${offer.id}`} prefetch="viewport" className="select-none group">
      <Card className="w-52 md:w-full overflow-hidden rounded-lg border-0 relative">
        <Image
          src={
            getImage(offer.keyImages, [
              'OfferImageTall',
              'Thumbnail',
              'DieselGameBoxTall',
              'DieselStoreFrontTall',
            ])?.url
          }
          alt="Game Cover"
          width={600}
          height={800}
          quality="high"
          className="w-full h-auto object-cover"
        />
        <div className="relative p-4 bg-card h-44 shadow-xl">
          <div className="flex flex-col z-10 h-full">
            <div className="flex items-start justify-between mb-2 z-10">
              <h3 className={cn('text-xl font-bold', textSizes[size] ?? textSizes.xl)}>
                {offer.title}
              </h3>
              {/* <div className="flex items-center gap-1 text-sm font-medium">
                <StarIcon className="w-4 h-4 fill-primary" />
                <span>4.8</span>
              </div> */}
            </div>
            <div className="text-sm text-muted-foreground mb-4 z-10">
              {offerGenres.length > 0 ? offerGenres.join(', ') : offersDictionary[offer.offerType]}
            </div>
            <div className="text-lg font-bold text-primary inline-flex items-end gap-2 z-10 h-full">
              {isReleased && offer.price && (
                <div className="flex items-center gap-2 text-right w-full justify-start">
                  <span>{isFree ? 'Free' : fmt.format(offer.price.price.discountPrice / 100)}</span>
                  {offer.price.price.discount > 0 && (
                    <span className="line-through text-sm">
                      {fmt.format(offer.price.price.originalPrice / 100)}
                    </span>
                  )}
                </div>
              )}
              {!isReleased && isPreOrder && (
                <span>{fmt.format(offer.price.price.discountPrice / 100)}</span>
              )}
              {!isReleased && !isPreOrder && !offer.price && <span>Coming Soon</span>}
              {!isReleased &&
                !isPreOrder &&
                offer.price &&
                offer.price.price.discountPrice !== 0 && (
                  <span>{fmt.format(offer.price.price.discountPrice / 100)}</span>
                )}
              {!isReleased &&
                !isPreOrder &&
                offer.price &&
                offer.price.price.discountPrice === 0 && <span>Coming Soon</span>}
            </div>
          </div>
          <div
            className="absolute top-0 left-0 opacity-[0.075] transition-opacity duration-1000 ease-in-out group-hover:opacity-[0.2]"
            style={{
              width: '100%',
              height: '100%',
              backgroundImage: gradient ?? 'linear-gradient(0deg, #000, #000)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              zIndex: 1,
            }}
          />
        </div>
      </Card>
    </Link>
  );
}

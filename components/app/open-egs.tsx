import type { SingleOffer } from '@/types/single-offer';
import { Button } from '../ui/button';
import { Link } from '@tanstack/react-router';
import { EGSIcon } from '../icons/egs';

function trackEvent(offer: SingleOffer) {
  window.umami.track('open-egs', {
    id: offer.id,
    namespace: offer.namespace,
  });
}

export function OpenEgs({ offer }: { offer: SingleOffer }) {
  const urlType: 'product' | 'url' =
    offer.offerType === 'BASE_GAME' ? 'product' : 'url';
  const isBundle = offer.offerType === 'BUNDLE';
  const namespace = isBundle ? 'bundles' : 'product';
  const url =
    offer.customAttributes?.['com.epicgames.app.productSlug']?.value ??
    offer.offerMappings?.[0]?.pageSlug ??
    offer.urlSlug ??
    (urlType === 'product' ? offer.productSlug : offer.urlSlug);

  if (!url) {
    return null;
  }

  return (
    <Button
      asChild
      className="bg-gray-900 text-white dark:hover:text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700"
    >
      <Link
        to={`https://store.epicgames.com/${namespace}/${url.replaceAll('-pp', '')}?utm_source=egdata.app`}
        rel="noopener noreferrer"
        referrerPolicy="no-referrer"
        target="_blank"
        onClick={() => trackEvent(offer)}
      >
        <div className="flex items-center justify-center gap-2">
          <EGSIcon className="h-6 w-6" />
          <span className="font-semibold">Store</span>
        </div>
      </Link>
    </Button>
  );
}

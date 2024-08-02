import type { SingleOffer } from '~/types/single-offer';
import { Button } from '../ui/button';
import { EpicGamesIcon } from '../icons/epic';
import { getSession, getTempUserId } from '~/lib/user-info';

function trackEvent(offer: SingleOffer) {
  const userId = getTempUserId();
  const session = getSession();

  const trackData = {
    event: 'open-egl',
    location: window.location.href,
    params: {
      offerId: offer.id,
      offerNamespace: offer.namespace,
    },
    userId,
    session,
  };

  navigator.serviceWorker.controller?.postMessage({
    type: 'track',
    payload: trackData,
  });
}

export function OpenEgl({
  offer,
}: {
  offer: SingleOffer;
}) {
  const urlType: 'product' | 'url' = offer.offerType === 'BASE_GAME' ? 'product' : 'url';
  const isBundle = offer.offerType === 'BUNDLE';
  const namespace = isBundle ? 'bundles' : 'product';
  const url =
    offer.customAttributes?.['com.epicgames.app.productSlug'] ??
    offer.offerMappings?.[0]?.pageSlug ??
    (urlType === 'product' ? offer.productSlug : offer.urlSlug);

  if (!url) {
    return null;
  }

  return (
    <Button
      variant="outline"
      className="bg-gray-900 text-white dark:hover:text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700"
      onClick={() => {
        trackEvent(offer);
        open(`com.epicgames.launcher://store/${namespace}/${url}?utm_source=egdata.app`);
      }}
    >
      <div className="flex items-center justify-center gap-2">
        <EpicGamesIcon className="h-6 w-6" />
        <span className="font-semibold">Open</span>
      </div>
    </Button>
  );
}

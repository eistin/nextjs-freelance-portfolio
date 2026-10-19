// Google Analytics configuration for Next.js
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// gtag.js is loaded lazily, so calls can land before it is ready. The inline
// snippet in the layout defines the dataLayer shim, which queues them.
const gtagReady = () =>
  typeof window !== 'undefined' &&
  typeof window.gtag === 'function' &&
  Boolean(GA_MEASUREMENT_ID);

// Joins a pathname and a query string into the url GA reports on.
export const pageUrl = (pathname: string, search: string) =>
  search ? `${pathname}?${search}` : pathname;

// Every view is sent explicitly, the first load included: the layout
// configures gtag with send_page_view disabled.
// https://developers.google.com/analytics/devguides/collection/ga4/views
export const pageview = (url: string) => {
  if (gtagReady()) {
    window.gtag('event', 'page_view', {
      page_path: url,
      page_location: `${window.location.origin}${url}`,
    });
  }
};

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  if (gtagReady()) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Type definitions for gtag
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event',
      targetId: string,
      config?: {
        page_path?: string;
        page_location?: string;
        event_category?: string;
        event_label?: string;
        value?: number;
      }
    ) => void;
  }
}
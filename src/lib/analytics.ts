// Analytics utility for tracking button clicks and user interactions.
// Two destinations: Google Analytics 4 and the first-party collector.
//
// Nothing is written to the visitor's device. There was once a localStorage
// ring buffer of the last 100 events here, each carrying the raw user agent
// and the full URL including its query string, read by nobody. It was removed:
// the design's consent-free position rests on "no cookie or device storage",
// and a store no caller read made that claim false for no benefit.

import * as gtag from './gtag';
import { send } from './analytics/beacon';

export interface AnalyticsEvent {
  type: string;
  action: string;
  label?: string;
  timestamp: string;
}

class Analytics {
  track(type: string, action: string, label?: string) {
    if (typeof window === 'undefined') return;

    const event: AnalyticsEvent = {
      type,
      action,
      label,
      timestamp: new Date().toISOString(),
    };

    // Log for development
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics Event:', event);
    }

    // Send to Google Analytics 4
    this.sendToGA4(event);

    // Second destination: the first-party collector. Never throws.
    if (type === 'button') {
      send({
        kind: 'click',
        path: window.location.pathname,
        element: (label?.split(' -> ')[0] || 'unknown').slice(0, 100),
      });
    } else if (type === 'form') {
      // A contact-form submit is the conversion on a freelance site, so it
      // reaches the collector as a click named form_submit rather than being
      // dropped for not being a button.
      send({
        kind: 'click',
        path: window.location.pathname,
        element: `form_${action}`.slice(0, 100),
      });
    }
  }

  private sendToGA4(event: AnalyticsEvent) {
    // Only send to GA4 if measurement ID is available
    if (!gtag.GA_MEASUREMENT_ID || typeof window === 'undefined') return;

    // For button clicks, create more specific event names
    if (event.type === 'button' && event.action === 'click') {
      const buttonName = event.label?.split(' -> ')[0] || 'unknown';

      // Send custom event with specific name
      window.gtag('event', `${buttonName}_click`, {
        event_category: 'engagement',
        event_label: event.label || undefined,
      });
    } else if (event.type === 'form') {
      // Handle form events
      window.gtag('event', `form_${event.action}`, {
        event_category: 'engagement',
        event_label: event.label || 'contact',
      });
    } else {
      // Generic events
      window.gtag('event', event.action, {
        event_category: event.type,
        event_label: event.label || undefined,
      });
    }
  }

  // Track button clicks
  trackButtonClick(buttonName: string, url?: string) {
    this.track('button', 'click', `${buttonName}${url ? ` -> ${url}` : ''}`);
  }

  // Track section views
  trackSectionView(sectionName: string) {
    this.track('section', 'view', sectionName);
  }

  // Track form interactions
  trackFormEvent(action: 'start' | 'submit' | 'error', formName: string) {
    this.track('form', action, formName);
  }
}

// Singleton instance
export const analytics = new Analytics();

// Utility hook for React components
export function useAnalytics() {
  return {
    trackButtonClick: analytics.trackButtonClick.bind(analytics),
    trackSectionView: analytics.trackSectionView.bind(analytics),
    trackFormEvent: analytics.trackFormEvent.bind(analytics),
  };
}

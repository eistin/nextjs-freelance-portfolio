// Analytics utility for tracking button clicks and user interactions
// Integrates with Google Analytics 4 and stores events locally

import * as gtag from './gtag';

export interface AnalyticsEvent {
  type: string;
  action: string;
  label?: string;
  timestamp: string;
  url: string;
  userAgent: string;
}

class Analytics {
  private events: AnalyticsEvent[] = [];
  private storageKey = 'portfolio_analytics';

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadEvents();
    }
  }

  private loadEvents() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.events = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load analytics events:', error);
    }
  }

  private saveEvents() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.events.slice(-100))); // Keep last 100 events
    } catch (error) {
      console.warn('Failed to save analytics events:', error);
    }
  }

  track(type: string, action: string, label?: string) {
    if (typeof window === 'undefined') return;

    const event: AnalyticsEvent = {
      type,
      action,
      label,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    this.events.push(event);
    this.saveEvents();

    // Log for development
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics Event:', event);
    }

    // Send to Google Analytics 4
    this.sendToGA4(event);
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

  // Get analytics summary (for admin/debugging)
  getSummary(): { [key: string]: number } {
    const summary: { [key: string]: number } = {};
    
    this.events.forEach(event => {
      const key = `${event.type}_${event.action}${event.label ? `_${event.label}` : ''}`;
      summary[key] = (summary[key] || 0) + 1;
    });

    return summary;
  }

  // Get all events (for admin/debugging)
  getAllEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  // Clear all events
  clearEvents() {
    this.events = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.storageKey);
    }
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
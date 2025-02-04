type EventType = 
  | 'page_view'
  | 'code_generation'
  | 'component_detection'
  | 'style_transfer'
  | 'error'
  | 'user_action';

interface EventProperties {
  userId?: string;
  projectId?: string;
  duration?: number;
  error?: string;
  [key: string]: any;
}

interface AnalyticsProvider {
  trackEvent: (eventName: string, properties?: EventProperties) => Promise<void>;
  trackPageView: (path: string, properties?: EventProperties) => Promise<void>;
  identify: (userId: string, traits?: Record<string, any>) => Promise<void>;
}

class PostHogProvider implements AnalyticsProvider {
  private posthog: any;
  
  constructor() {
    if (typeof window !== 'undefined') {
      import('posthog-js').then(({ default: posthog }) => {
        posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
          api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
          autocapture: true,
          capture_pageview: false,
          persistence: 'localStorage',
        });
        this.posthog = posthog;
      });
    }
  }

  async trackEvent(eventName: string, properties?: EventProperties): Promise<void> {
    if (this.posthog) {
      this.posthog.capture(eventName, properties);
    }
  }

  async trackPageView(path: string, properties?: EventProperties): Promise<void> {
    if (this.posthog) {
      this.posthog.capture('$pageview', { ...properties, path });
    }
  }

  async identify(userId: string, traits?: Record<string, any>): Promise<void> {
    if (this.posthog) {
      this.posthog.identify(userId, traits);
    }
  }
}

export class Analytics {
  private static instance: Analytics;
  private providers: AnalyticsProvider[] = [];
  private queue: { event: string; properties?: EventProperties }[] = [];
  private isInitialized = false;

  private constructor() {
    // Initialize analytics providers
    this.providers.push(new PostHogProvider());
    
    // Process queued events once initialized
    setTimeout(() => {
      this.isInitialized = true;
      this.processQueue();
    }, 1000);
  }

  static getInstance(): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics();
    }
    return Analytics.instance;
  }

  private async processQueue() {
    while (this.queue.length > 0) {
      const item = this.queue.shift();
      if (item) {
        await this.trackEvent(item.event, item.properties);
      }
    }
  }

  async trackEvent(event: EventType, properties?: EventProperties) {
    if (!this.isInitialized) {
      this.queue.push({ event, properties });
      return;
    }

    try {
      await Promise.all(
        this.providers.map(provider => 
          provider.trackEvent(event, {
            timestamp: Date.now(),
            ...properties,
          })
        )
      );
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  async trackPageView(path: string, properties?: EventProperties) {
    if (!this.isInitialized) {
      this.queue.push({ event: 'page_view', properties: { path, ...properties } });
      return;
    }

    try {
      await Promise.all(
        this.providers.map(provider => 
          provider.trackPageView(path, properties)
        )
      );
    } catch (error) {
      console.error('Failed to track page view:', error);
    }
  }

  async identify(userId: string, traits?: Record<string, any>) {
    if (!this.isInitialized) {
      return;
    }

    try {
      await Promise.all(
        this.providers.map(provider => 
          provider.identify(userId, traits)
        )
      );
    } catch (error) {
      console.error('Failed to identify user:', error);
    }
  }

  // Performance tracking
  async trackPerformance(name: string, duration: number, properties?: EventProperties) {
    await this.trackEvent('performance', {
      name,
      duration,
      ...properties,
    });
  }

  // Error tracking
  async trackError(error: Error, properties?: EventProperties) {
    await this.trackEvent('error', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...properties,
    });
  }

  // User action tracking
  async trackUserAction(action: string, properties?: EventProperties) {
    await this.trackEvent('user_action', {
      action,
      ...properties,
    });
  }
}

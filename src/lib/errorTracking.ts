type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

interface ErrorMetadata {
  userId?: string;
  path?: string;
  component?: string;
  [key: string]: any;
}

class ErrorTracker {
  private static instance: ErrorTracker;
  private errors: Map<string, number> = new Map();
  private readonly ERROR_THRESHOLD = 5;
  
  private constructor() {}
  
  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }
  
  trackError(
    error: Error,
    severity: ErrorSeverity = 'medium',
    metadata: ErrorMetadata = {}
  ) {
    const errorKey = this.getErrorKey(error);
    const count = (this.errors.get(errorKey) || 0) + 1;
    this.errors.set(errorKey, count);
    
    const errorData = {
      message: error.message,
      stack: error.stack,
      severity,
      count,
      timestamp: new Date().toISOString(),
      ...metadata,
    };
    
    // Log error
    console.error('Error tracked:', errorData);
    
    // Send to monitoring service if count exceeds threshold
    if (count >= this.ERROR_THRESHOLD) {
      this.reportToMonitoring(errorData);
    }
    
    return errorData;
  }
  
  private getErrorKey(error: Error): string {
    return `${error.name}:${error.message}`;
  }
  
  private async reportToMonitoring(errorData: any) {
    // TODO: Implement reporting to your preferred monitoring service
    // Example: Sentry, LogRocket, etc.
    if (process.env.NODE_ENV === 'production') {
      try {
        // Send to monitoring service
        // await monitoringService.report(errorData);
        console.log('Error reported to monitoring service:', errorData);
      } catch (err) {
        console.error('Failed to report to monitoring service:', err);
      }
    }
  }
  
  clearErrors() {
    this.errors.clear();
  }
  
  getErrorCount(error: Error): number {
    return this.errors.get(this.getErrorKey(error)) || 0;
  }
}

// Error boundary component for React
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };
  
  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }
  
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    ErrorTracker.getInstance().trackError(error, 'high', {
      component: this.constructor.name,
      errorInfo,
    });
  }
  
  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-red-50 text-red-800 rounded-lg">
          <h2 className="text-lg font-semibold">Something went wrong</h2>
          <p>Please try refreshing the page</p>
        </div>
      );
    }
    
    return this.props.children;
  }
}

export const errorTracker = ErrorTracker.getInstance();

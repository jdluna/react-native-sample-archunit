// Telemetry contract interface
export interface ITelemetryContract {
  trackEvent(eventName: string, properties?: Record<string, any>): void;
}

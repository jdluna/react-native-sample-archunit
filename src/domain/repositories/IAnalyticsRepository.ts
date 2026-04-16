// Analytics repository interface
export interface IAnalyticsRepository {
  getMetrics(): Promise<any>;
}

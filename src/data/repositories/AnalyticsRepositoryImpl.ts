// src/data/repositories/AnalyticsRepositoryImpl.ts
// Data Layer — concrete IAnalyticsRepository implementation

import { MetricsSummary } from '@contracts/sdk/IAnalyticsSDKContract';
import {
  IAnalyticsRepository,
  AnalyticsEvent,
  EventFilters,
} from '@domain/repositories/IAnalyticsRepository';
import {
  IAnalyticsRemoteDataSource,
  IAnalyticsLocalDataSource,
} from '../datasources/AnalyticsDataSource';

export class AnalyticsRepositoryImpl implements IAnalyticsRepository {
  constructor(
    private readonly remote: IAnalyticsRemoteDataSource,
    private readonly local: IAnalyticsLocalDataSource,
    private readonly getAuthToken: () => Promise<string | null>,
  ) {}

  async fetchMetricsSummary(): Promise<MetricsSummary> {
    const cached = this.local.getCachedSummary();
    if (cached) return cached;

    const token = await this.getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const summary = await this.remote.fetchMetricsSummary(token);
    this.local.cacheSummary(summary);
    return summary;
  }

  async fetchEventHistory(filters: EventFilters): Promise<AnalyticsEvent[]> {
    const token = await this.getAuthToken();
    if (!token) return this.local.getQueuedEvents();
    return this.remote.fetchEvents(token, filters);
  }

  async saveEvent(event: AnalyticsEvent): Promise<void> {
    const token = await this.getAuthToken();
    if (!token) {
      // Offline — queue locally
      this.local.enqueueEvent(event);
      return;
    }
    try {
      await this.remote.postEvent(token, event);
    } catch {
      // Fallback to local queue on network failure
      this.local.enqueueEvent(event);
    }
  }
}

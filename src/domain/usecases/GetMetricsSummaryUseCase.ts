// src/domain/usecases/GetMetricsSummaryUseCase.ts
// Domain Layer — orchestrates domain logic, depends only on domain interfaces

import { MetricsSummary } from '@contracts/sdk/IAnalyticsSDKContract';
import { IAnalyticsRepository } from '../repositories/IAnalyticsRepository';

export interface IGetMetricsSummaryUseCase {
  execute(): Promise<MetricsSummary>;
}

export class GetMetricsSummaryUseCase implements IGetMetricsSummaryUseCase {
  constructor(private readonly repository: IAnalyticsRepository) {}

  async execute(): Promise<MetricsSummary> {
    const summary = await this.repository.fetchMetricsSummary();

    // Domain logic: clamp error rate between 0 and 1
    return {
      ...summary,
      errorRate: Math.max(0, Math.min(1, summary.errorRate)),
    };
  }
}

// src/domain/usecases/TrackEventUseCase.ts
import { ITelemetryContract, TelemetryEvent } from '@contracts/telemetry/ITelemetryContract';
import { IAnalyticsRepository, AnalyticsEvent } from '../repositories/IAnalyticsRepository';

export interface ITrackEventUseCase {
  execute(event: TelemetryEvent, userId: string | null): Promise<void>;
}

export class TrackEventUseCase implements ITrackEventUseCase {
  constructor(
    private readonly analyticsRepository: IAnalyticsRepository,
    private readonly telemetry: ITelemetryContract,
  ) {}

  async execute(event: TelemetryEvent, userId: string | null): Promise<void> {
    const domainEvent: AnalyticsEvent = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: event.name,
      userId,
      properties: event.properties ?? {},
      timestamp: event.timestamp ?? Date.now(),
      sessionId: 'session-placeholder',
    };

    await this.analyticsRepository.saveEvent(domainEvent);
    this.telemetry.trackEvent(event);
  }
}

// src/domain/usecases/FlushEventsUseCase.ts
export interface IFlushEventsUseCase {
  execute(): Promise<FlushResult>;
}

export interface FlushResult {
  flushedCount: number;
  failedCount: number;
}

export class FlushEventsUseCase implements IFlushEventsUseCase {
  constructor(
    private readonly repository: IAnalyticsRepository,
    private readonly telemetry: ITelemetryContract,
  ) {}

  async execute(): Promise<FlushResult> {
    try {
      await this.telemetry.flush();
      return { flushedCount: 1, failedCount: 0 };
    } catch (error) {
      this.telemetry.trackError(error instanceof Error ? error : new Error(String(error)));
      return { flushedCount: 0, failedCount: 1 };
    }
  }
}

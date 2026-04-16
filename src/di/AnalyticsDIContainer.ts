// src/di/AnalyticsDIContainer.ts
// DI Container — the only place that knows about ALL layers
// Binds interfaces to concrete implementations

import { ITelemetryContract, TelemetryConfig } from '@contracts/telemetry/ITelemetryContract';
import { IAuthContract } from '@contracts/sdk/IAnalyticsSDKContract';
import { IAnalyticsRepository } from '@domain/repositories/IAnalyticsRepository';
import {
  GetMetricsSummaryUseCase,
  IGetMetricsSummaryUseCase,
} from '@domain/usecases/GetMetricsSummaryUseCase';
import {
  TrackEventUseCase,
  ITrackEventUseCase,
} from '@domain/usecases/GetMetricsSummaryUseCase';
import { AnalyticsRepositoryImpl } from '@data/repositories/AnalyticsRepositoryImpl';
import {
  AnalyticsRemoteDataSource,
  AnalyticsLocalDataSource,
} from '@data/datasources/AnalyticsDataSource';
import { AnalyticsDashboardViewModel } from '@presentation/viewmodels/AnalyticsDashboardViewModel';

export interface DIContainerConfig {
  apiBaseUrl: string;
  telemetryConfig: TelemetryConfig;
  telemetryImpl: ITelemetryContract;
  authContract: IAuthContract;
}

export class AnalyticsDIContainer {
  private readonly telemetry: ITelemetryContract;
  private readonly repository: IAnalyticsRepository;
  private readonly getMetricsSummaryUseCase: IGetMetricsSummaryUseCase;
  private readonly trackEventUseCase: ITrackEventUseCase;

  constructor(private readonly config: DIContainerConfig) {
    // Data layer
    const remoteDataSource = new AnalyticsRemoteDataSource(config.apiBaseUrl);
    const localDataSource = new AnalyticsLocalDataSource();

    this.telemetry = config.telemetryImpl;

    this.repository = new AnalyticsRepositoryImpl(
      remoteDataSource,
      localDataSource,
      () => config.authContract.getAuthToken(),
    );

    // Domain layer
    this.getMetricsSummaryUseCase = new GetMetricsSummaryUseCase(this.repository);
    this.trackEventUseCase = new TrackEventUseCase(this.repository, this.telemetry);
  }

  // Factory methods for ViewModels — called by Presentation layer
  createDashboardViewModel(): AnalyticsDashboardViewModel {
    return new AnalyticsDashboardViewModel(
      this.getMetricsSummaryUseCase,
      this.trackEventUseCase,
      this.telemetry,
    );
  }
}

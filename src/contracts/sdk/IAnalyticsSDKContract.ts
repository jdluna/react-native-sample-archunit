// Analytics SDK contracts
export interface IAnalyticsSDKContract {
  initialize(config: any): Promise<void>;
}

export interface IAuthContract {
  getAuthToken(): string;
}

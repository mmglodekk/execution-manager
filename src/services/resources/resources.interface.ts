export interface ResourceEnvelope {
  id: string;
  concurrentExecutions: number;
}

export interface ResourceUpdateRequest {
  concurrency: number
}

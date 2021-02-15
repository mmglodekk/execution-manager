export interface ExecutionStatistics {
  resourceId: string;
  processed: number;
  busyWorkers: number;
  activeWorkers: number;
  currentCommand?: string;
  processing: boolean;
  tasksLeft: number;
}

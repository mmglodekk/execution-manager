import { ExecutionProcessor } from './execution-processor';
import { appLogger } from '../../system/logger/app-logger';
import { QueueAdapter } from '../../system/queue-adapter/queue-adapter';

export class ExecutionProcessorFactory {
  private readonly resourceProcessors = new Map<string, ExecutionProcessor>();

  constructor(
    private readonly queueAdapter: QueueAdapter
  ) { }

  public getProcessor(resourceId: string): ExecutionProcessor {
    let processor = this.resourceProcessors.get(resourceId);
    if (!processor) {
      appLogger.info(`Creating processor for ${resourceId}`);
      processor = new ExecutionProcessor(resourceId, this.queueAdapter);
      this.resourceProcessors.set(resourceId, processor);
    }
    return processor;
  }
}

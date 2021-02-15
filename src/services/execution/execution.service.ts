import { configService } from '../../system/config/config.service';
import { QueueAdapter } from '../../system/queue-adapter/queue-adapter';
import { ResourcesService } from '../resources/resources.service';
import { ExecutionStatistics } from './execution-statistics.interface';
import { ExecutionProcessorFactory } from './execution-processor.factory';

export class ExecutionService {
  private readonly queueName = configService.get('mqttQueuePrefix');

  constructor(
    private readonly queueAdapter: QueueAdapter,
    private readonly resourcesService: ResourcesService,
    private readonly processorFactory: ExecutionProcessorFactory
  ) {
    this.subscribeToResourceChanges();
  }

  async getExecutionStatistics(resourceId: string): Promise<ExecutionStatistics> {
    const processor = this.processorFactory.getProcessor(resourceId);
    return processor.getStatistics();
  }

  async registerExecutionTask(resourceId: string): Promise<void> {
    const queue = `${this.queueName}-${resourceId}`;
    this.resourcesService.notifyResourceAppearance(resourceId);
    await this.queueAdapter.sendToQueue(queue, 'process');
  }

  private subscribeToResourceChanges(): void {
    this.resourcesService
      .getResourceChangesStream()
      .subscribe(resource => {
        this.updateAndProcess(resource.id, resource.concurrentExecutions);
      });
  }

  private updateAndProcess(resourceId: string, concurrency: number): void {
    const command = configService.get('defaultCommand');
    this.processorFactory
      .getProcessor(resourceId)
      .updateSettings(concurrency, command);
  }
}

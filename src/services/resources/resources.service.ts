import { configService } from '../../system/config/config.service';
import { QueueAdapter } from '../../system/queue-adapter/queue-adapter';
import { Observable, ReplaySubject } from 'rxjs';
import { ResourceEnvelope } from './resources.interface';
import { appLogger } from '../../system/logger/app-logger';

export class ResourcesService {
  private resourcesMap = new Map<string, number>();
  private readonly initialResources = configService.get('initialResourceIds');
  private readonly resourcesQueueName = configService.get('mqttResourcesQueueName');
  private readonly initialExecutions = configService.get('initialResourceExecutions');
  private readonly resourcesQueue = new ReplaySubject<ResourceEnvelope>()

  constructor(private queueAdapter: QueueAdapter) {
    this.registerDefinedResources();
    this.subscribeToResources();
  }

  notifyResourceAppearance(resourceId: string): void {
    const shouldAdd = configService.get('automaticallyAddResources')
      && !this.resourcesMap.get(resourceId);
    if (shouldAdd) {
      this.changeResourceConcurrency(resourceId, this.initialExecutions);
    }
  }

  getResourceChangesStream(): Observable<ResourceEnvelope> {
    return this.resourcesQueue.asObservable();
  }

  changeResourceConcurrency(id: string, concurrentExecutions: number): void {
    const message = JSON.stringify({ id, concurrentExecutions });
    void this.queueAdapter.sendToQueue(this.resourcesQueueName, message);
  }

  private registerDefinedResources(): void {
    this.initialResources.forEach(id => {
      const concurrentExecutions = this.initialExecutions;
      this.resourcesQueue.next({ id, concurrentExecutions })
    });
  }

  private subscribeToResources(): void {
    this.queueAdapter
      .getMessagesStream(this.resourcesQueueName)
      .subscribe(msg => this.handleResourceMessage(msg));
  }

  private handleResourceMessage(msg: string): void {
    try {
      const parsed = ResourcesService.parseResourceMessage(msg);
      this.resourcesMap.set(parsed.id, parsed.concurrentExecutions);
      this.resourcesQueue.next({
        id: parsed.id,
        concurrentExecutions: parsed.concurrentExecutions
      })
    } catch (e) {
      appLogger.error('Cannot parse incoming resources message', e);
    }
  }

  private static parseResourceMessage(message: string): ResourceEnvelope {
    const parsed = JSON.parse(message);
    const valid = typeof parsed.id === 'string'
      && typeof parsed.concurrentExecutions === 'number';
    if (!valid) {
      throw new Error('Resource message fields incorrect!')
    }
    return parsed;
  }
}

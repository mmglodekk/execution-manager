import { Express, Request, Response } from 'express';
import { ExecutionService } from '../services/execution/execution.service';
import { appLogger } from '../system/logger/app-logger';
import { ResourcesService } from '../services/resources/resources.service';
import { ResourceEnvelope, ResourceUpdateRequest } from '../services/resources/resources.interface';

export class ResourcesController {
  constructor(
    private readonly app: Express,
    private readonly executionService: ExecutionService,
    private readonly resourcesService: ResourcesService
  ) {
    this.registerEndpoints();
  }

  private registerEndpoints(): void {
    this.app.get('/:resourceId/execute', this.processingRequestHandler.bind(this));
    this.app.get('/:resourceId/status', this.statusHandler.bind(this));
    this.app.put('/:resourceId', this.updateHandler.bind(this));
  }

  private processingRequestHandler(req: Request, res: Response): void {
    const { resourceId } = req.params;
    appLogger.trace(`Received task request id: ${resourceId}`);
    void this.executionService.registerExecutionTask(resourceId);
    res.statusCode = 200;
    res.send('OK');
  }

  private async statusHandler(req: Request, res: Response): Promise<void> {
    const { resourceId } = req.params;
    const statistics = await this.executionService
      .getExecutionStatistics(resourceId);
    res.statusCode = 200;
    res.send(JSON.stringify(statistics));
  }

  private updateHandler(req: Request, res: Response): void {
    const { resourceId } = req.params;
    try {
      const resource = ResourcesController.parseUpdateMessage(resourceId, req.body);
      appLogger.trace(`Updating task: ${resourceId}, to concurrency: ${resource.concurrentExecutions}`);
      this.resourcesService.changeResourceConcurrency(resourceId, resource.concurrentExecutions);
      res.statusCode = 200;
      res.send('Resource updated');
    } catch (e) {
      appLogger.error('Error during update request', e);
      res.statusCode = 500;
      res.send();
    }
  }

  private static parseUpdateMessage(
    resourceId: string,
    requestBody: unknown
  ): ResourceEnvelope {
    if (!ResourcesController.isCorrectUpdatePayload(requestBody)) {
      throw new Error('Incorrect payload for task update');
    }
    return {
      id: resourceId,
      concurrentExecutions: requestBody.concurrency
    };
  }

  public static isCorrectUpdatePayload(requestBody: unknown): requestBody is ResourceUpdateRequest {
    return typeof requestBody === 'object'
      && typeof (requestBody as ResourceUpdateRequest).concurrency === "number";
  }
}

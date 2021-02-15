import { Subject } from 'rxjs';

import { ExecutionService } from './execution.service';
import { ResourcesService } from '../resources/resources.service';
import { QueueAdapter } from '../../system/queue-adapter/queue-adapter';
import { ExecutionProcessorFactory } from './execution-processor.factory';
import { ResourceEnvelope } from '../resources/resources.interface';
import { ExecutionProcessor } from './execution-processor';

describe('ExecutionService', () => {
  let executionService: ExecutionService;
  let resourceChangesStream: Subject<ResourceEnvelope>;
  let processorMock: ExecutionProcessor;
  let processorFactory: ExecutionProcessorFactory;
  let resourcesServiceMock: ResourcesService;
  let queueAdapterMock: QueueAdapter;

  beforeEach(() => {
    resourceChangesStream = new Subject();
    queueAdapterMock = { sendToQueue: jest.fn() } as unknown as QueueAdapter;
    resourcesServiceMock = {
      notifyResourceAppearance: jest.fn(),
      getResourceChangesStream: jest.fn().mockReturnValue(resourceChangesStream),
    } as unknown as ResourcesService;
    processorMock = {
      updateSettings: jest.fn(),
      getStatistics: jest.fn().mockResolvedValue({ stats: true })
    } as unknown as ExecutionProcessor;
    processorFactory = {
      getProcessor: jest.fn().mockReturnValue(processorMock)
    } as unknown as ExecutionProcessorFactory;
    executionService = new ExecutionService(queueAdapterMock, resourcesServiceMock, processorFactory);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should send new task to queue', () => {
    executionService.registerExecutionTask('res-id-a');
    expect(queueAdapterMock.sendToQueue).toHaveBeenCalledTimes(1);
    expect(queueAdapterMock.sendToQueue)
      .toHaveBeenCalledWith('tasks-res-id-a', expect.anything());
  });

  it('should be able to send more than one event', () => {
    for (let i = 0; i < 30; i++) {
      executionService.registerExecutionTask('res-id-e');
    }
    expect(queueAdapterMock.sendToQueue).toHaveBeenCalledTimes(30);
  });

  it('should notify about new resource on execution', () => {
    executionService.registerExecutionTask('res-id-a');
    expect(resourcesServiceMock.notifyResourceAppearance).toHaveBeenCalledWith('res-id-a');
  });

  it('should return execution statistics', async () => {
    const stats = await executionService.getExecutionStatistics('res-id-a');
    expect(stats).toEqual({ stats: true });
  });

  it('should react to resource changes', (done) => {
    expect(processorMock.updateSettings).not.toHaveBeenCalled();
    resourceChangesStream.subscribe(() => {
      expect(processorMock.updateSettings).toHaveBeenCalledTimes(1);
      expect(processorMock.updateSettings)
        .toHaveBeenCalledWith(3, 'sleep 10 && echo ${RESOURCE_ID}');
      done();
    });
    const envelope: ResourceEnvelope = { concurrentExecutions: 3, id: 'res-id-b' };
    resourceChangesStream.next(envelope);
  });
});

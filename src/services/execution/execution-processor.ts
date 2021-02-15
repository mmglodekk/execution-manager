import { Subject } from 'rxjs';
import { exec } from 'child_process';
import { QueueAdapter } from '../../system/queue-adapter/queue-adapter';
import { configService } from '../../system/config/config.service';
import { appLogger } from '../../system/logger/app-logger';
import { filter } from 'rxjs/operators';
import { promisify } from 'util';
import { ExecutionStatistics } from './execution-statistics.interface';

const execPromise = promisify(exec);

export class ExecutionProcessor {
  private static queuePrefix = configService.get('mqttQueuePrefix');
  private readonly queueId = `${ExecutionProcessor.queuePrefix}-${this.resourceId}`;

  private concurrency = 0;
  private processed = 0;
  private busyWorkers = 0;

  private processingActive = false;
  private command: string;
  private freeProcess$ = new Subject<number>();

  constructor(
    private readonly resourceId: string,
    private readonly queueAdapter: QueueAdapter
  ) {
    this.subscribeToFreeProcess();
  }

  async getStatistics(): Promise<ExecutionStatistics> {
    const queueStats = await this.queueAdapter
      .getMessagesCount(this.queueId);
    return {
      activeWorkers: this.concurrency,
      busyWorkers: this.busyWorkers,
      processed: this.processed,
      resourceId: this.resourceId,
      currentCommand: this.command,
      processing: this.processingActive,
      tasksLeft: queueStats.messageCount
    }
  }

  updateSettings(concurrency: number, command: string): void {
    this.command = command;
    if (this.concurrency !== concurrency) {
      const debugMsg = `Reacting to resource change: ${this.resourceId}, concurrency: ${concurrency}`;
      appLogger.debug(debugMsg);
      this.supplyMissingWorkers(concurrency);
    }
    this.processingActive = true;
  }

  private supplyMissingWorkers(newConcurrency: number) {
    const previousConcurrency = this.concurrency;
    this.concurrency = newConcurrency;
    for (let i = previousConcurrency; i < newConcurrency; i++) {
      appLogger.info(`Adding new worker (${this.resourceId}, ${i})`)
      this.freeProcess$.next(i);
    }
  }

  private async process(processId: number): Promise<void> {
    this.busyWorkers++;
    appLogger.trace(`Processing new task (${this.resourceId}, ${processId})`);
    const processOptions = { env: { RESOURCE_ID: this.resourceId }};
    const { stdout, stderr } = await execPromise(this.command, processOptions);
    this.logOutput('STDOUT', processId, stdout);
    this.logOutput('STDERR', processId, stderr);
    appLogger.trace(`Processing finished (${this.resourceId}, ${processId})`);
    this.busyWorkers--;
    this.processed++;
  }

  private subscribeToFreeProcess(): void {
    this.freeProcess$
      .pipe(
        filter(processNo => this.filterRedundantWorkers(processNo))
      )
      .subscribe(async (processId) => {
        const msg = await this.queueAdapter.getNextMessage(this.queueId, true);
        msg === undefined
          ? await this.sleep(100)
          : await this.process(processId);
        this.freeProcess$.next(processId);
      });
  }

  private sleep(time: number): Promise<void> {
    return new Promise((r) => setTimeout(r, time));
  }

  private logOutput(stream: string, processId: number, msg: string): void {
    const trimmed = msg.trim();
    if (trimmed) {
      appLogger.debug(`Output ${stream} (${this.resourceId}, ${processId}): \n ${trimmed}`);
    }
  }

  private filterRedundantWorkers(processId: number): boolean {
    const isUsable = processId < this.concurrency;
    if (!isUsable) {
      appLogger.info(`Removing redundant worker (${this.resourceId}, ${processId})`)
    }
    return isUsable;
  }
}

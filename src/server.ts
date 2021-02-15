import express, { Express } from 'express';
import bodyParser from 'body-parser';

import { ResourcesController } from './controllers/resources.controller';
import { ExecutionService } from './services/execution/execution.service';
import { appLogger, pinoHttp } from './system/logger/app-logger';
import { configService } from './system/config/config.service';
import { QueueAdapter } from './system/queue-adapter/queue-adapter';
import { ResourcesService } from './services/resources/resources.service';
import { ErrorsController } from './controllers/errors.controller';
import { ExecutionProcessorFactory } from './services/execution/execution-processor.factory';

const app: Express = express();

if (configService.get('logRequests')) {
  app.use(pinoHttp);
}

const jsonParser = bodyParser.json();
app.use(jsonParser);

const queueAdapter = new QueueAdapter();
const resourcesService = new ResourcesService(queueAdapter);
const processorFactory = new ExecutionProcessorFactory(queueAdapter);
const executionService = new ExecutionService(queueAdapter, resourcesService, processorFactory);

new ResourcesController(app, executionService, resourcesService);
new ErrorsController(app);

const port = configService.get('port');
app.listen(port, (err?: Error) => {
  if (err) {
    return appLogger.error(err);
  }
  return appLogger.info(`server is listening on ${port}`);
});

import { Express, Request, Response } from 'express';
import { NextFunction } from 'express-serve-static-core';

import { appLogger } from '../system/logger/app-logger';

export class ErrorsController {
  constructor(
    private readonly app: Express
  ) {
    this.registerCatchAllHandler();
    this.registerUncaughtErrorHandler();
  }

  registerCatchAllHandler(): void {
    this.app.all('*', (req, res) => {
      appLogger.warn(`Unhandled route ${req.method} ${req.path}`);
      res.statusCode = 404;
      res.send('Not found');
    });
  }

  registerUncaughtErrorHandler(): void {
    this.app.use(ErrorsController.errorHandler);
  }

  static errorHandler(
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    if (error) {
      appLogger.error(`Unhandled error: ${error.message}`);
      res.statusCode = 500;
      res.send('Request invalid!');
    }
  }
}

import pino, { LoggerOptions } from 'pino';
import pinoHttpLib from 'pino-http';

const pinoConfig: LoggerOptions = {
  prettyPrint: { colorize: true },
  level: 'trace'
};

export const pinoHttp = pinoHttpLib(pinoConfig);
export const appLogger = pino(pinoConfig);

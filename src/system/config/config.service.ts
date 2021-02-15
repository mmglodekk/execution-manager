import { configStatic } from './config.static';
import { AppConfig } from './config.interface';

class ConfigService {
  get config(): AppConfig {
    return configStatic;
  }

  get<T extends keyof AppConfig>(key: T): AppConfig[T]  {
    return configStatic[key];
  }
}

export const configService = new ConfigService();

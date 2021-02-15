export interface AppConfig {
  port: number;
  logRequests: boolean;
  mqttHost: string;
  mqttQueuePrefix: string;
  mqttResourcesQueueName: string;
  defaultCommand: string;
  initialResourceIds: string[];
  initialResourceExecutions: number;
  automaticallyAddResources: boolean
}

import { AppConfig } from './config.interface';

/**
 * Not for direct use!
 */
export const configStatic: AppConfig = {
  port: 5000,
  logRequests: false,
  mqttHost: 'amqp://localhost',
  mqttQueuePrefix: 'tasks',
  mqttResourcesQueueName: 'resourceIds',
  defaultCommand: 'sleep 10 && echo ${RESOURCE_ID}',
  initialResourceExecutions: 5,
  automaticallyAddResources: true,
  initialResourceIds: [
    'resourceA',
    'resourceB',
    '123123'
  ]
}

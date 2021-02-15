# Description
This software is highly dangerous (allowing remote code execution). 
Used only for educational purposes.

Distribute executions queue to multiple execution servers.

# Running server
```shell script
# for dev mode (with watch)
npm start 

# build and start
npm start:server 
```

# Configuration
Look for a configuration parameters inside `src/system/config/config.static.ts`.
```typescript
export const configStatic: AppConfig = {
  port: 5000, // application port
  logRequests: false, // turn express logging on/off
  mqttHost: 'amqp://localhost', // queue address
  mqttQueuePrefix: 'tasks', // prefix for tasks queues (target ex.: tasks-resourceA)
  mqttResourcesQueueName: 'resourceIds', // stream for new resourceIds
  defaultCommand: 'sleep 10 && echo ${RESOURCE_ID}', // default command to be executed
  initialResourceExecutions: 5, // initital parallel exectution
  automaticallyAddResources: true, // if set to false, it will use only predefined resource ids
  initialResourceIds: [
    'resourceA',
    'resourceB',
    '123123'
  ] // explained above
}
```

# Operating queue
You can change `resourceA` in below requests to any resourceId you want.

## Filling queue (+1 task):
```shell script
curl http://localhost:5000/resourceA/execute
```

## Changing processing concurrency
```shell script
curl -d '{"concurrency":5}' \
  -H "Content-Type: application/json" \
  -X PUT http://localhost:5000/resourceA
```

## Checking processing status
```shell script
curl -sS http://localhost:5000/resourceA/status
```

**expected response:**
```
{
  "resourceId": "resourceA",
  "currentCommand": "sleep 10 && echo ${RESOURCE_ID}",
  "activeWorkers": 5, // current concurrecy settings
  "busyWorkers": 0, // workers busy with processing
  "processed": 5, // tasks already processed
  "processing": true // if resource wasn't initiated, it will return false -> see config.automaticallyAddResources
  "messagesLeft": 0 // tasks left to be processed
}
```

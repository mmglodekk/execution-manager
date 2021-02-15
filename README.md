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

# Testing
```shell script
# Unit tests
npm run test:ci

# E2E tests (only once per server start - depends on state)
./test.sh

# Lint
npm run lint
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

# Solution Future and TODOs
* Docker run command not checked (used Podman on Fedora Linux)
* Service should have authorization and access separation. 
* One test has been written, just to set up testing. 
* Existing test is only a unit one. All deps are mocked. All other test types needed (API, integration).
* A little bash E2E test added (such a fun) `./test.sh`
* Implemented status endpoint, so it's easy to write E2E tests.
* Used a queue for publishing new resources. It's not the best solution, but due to the complexity, I didn't want to introduce another DB. 
* For future improvements: I would use NestJS, plus DI mechanism (instead of putting services together in `server.ts`).
* Config should be probably placed in the rootDir. I know, but didn't want to implement type checks on it.
* If we want to change command dynamically, we can extend `ResourceUpdateRequest` and add it's support in `ExecutionProcessor`
* Use topics instead of queues would make service scalable :) 
* Sleep function in `QueueAdapter` is not the best idea. It works, but I would be better, if it would be the part of `amqplib`.
* Above is also a suspect for a slight mem leak (still need to be investigated).

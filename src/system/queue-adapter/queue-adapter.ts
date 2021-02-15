import amqplib, { Channel } from 'amqplib';
import { Replies } from 'amqplib/properties';
import { Observable, Subject } from 'rxjs';

import { configService } from '../config/config.service';
import { appLogger } from '../logger/app-logger';

export class QueueAdapter {
  private channel: Channel;
  private initiation = this.initConnection();

  async getMessagesCount(queueName: string): Promise<Replies.AssertQueue> {
    await this.initiation;
    return await this.channel.assertQueue(queueName);
  }

  getMessagesStream(
    queueName: string,
    ack?: boolean
  ): Observable<string> {
    const messages = new Subject<string>();
    this.initiation.then(async () => {
      await this.channel.assertQueue(queueName);
      return this.channel.consume(queueName, (msg) => {
        if (msg !== null) {
          const messageBody = msg.content.toString();
          messages.next(messageBody);
          if (ack) {
            this.channel.ack(msg);
          }
        }
      });
    });
    return messages.asObservable();
  }

  async getNextMessage(
    queueName: string,
    ack?: boolean
  ): Promise<string | undefined> {
    await this.initiation;
    await this.channel.assertQueue(queueName);
    const msg = await this.channel.get(queueName);
    if (msg) {
      const messageBody = msg.content.toString();
      if (ack) {
        this.channel.ack(msg);
      }
      return messageBody;
    }
  }

  async sendToQueue(queueName: string, message: string): Promise<void> {
    await this.initiation;
    await this.channel.assertQueue(queueName);
    const payload = Buffer.from(message);
    await this.channel.sendToQueue(queueName, payload);
  }

  private async initConnection(): Promise<void> {
    try {
      const mqttHost = configService.get('mqttHost');
      const connection = await amqplib.connect(mqttHost);
      this.channel = await connection.createChannel();
      appLogger.info('Successfully connected to Queue');
    } catch (e) {
      appLogger.fatal('Couldn\'t establish mqtt connection');
    }
  }
}

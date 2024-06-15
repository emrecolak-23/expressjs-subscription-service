import { Publisher, Event } from "./base.publisher";

export class SubscriptionCreatedPublisher extends Publisher<Event> {
  constructor(channel: any, queueNames: string[]) {
    super(channel, queueNames);
  }
}

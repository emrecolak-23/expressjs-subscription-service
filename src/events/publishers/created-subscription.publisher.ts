import { Publisher, Event } from "./base.publisher";

export class CreatedSubscriptionPublisher extends Publisher<Event> {
    constructor(channel: any, queueNames: string[]) {
        super(channel, queueNames);
    }

}
import { v4 as uuidv4 } from "uuid";
import { Channel, ConsumeMessage } from "amqplib";
import { Listener } from "../base.listener";
import { Subjects, QueueNames } from "../subjects";
import { paymentCreatedValidationSchema } from "../queue-validation-schemas";
import { PaymentCreatedEvent } from "./payment-event.types";
import { ExceptionHandlerPublisher } from "../../publishers/exception-handler.publisher";
import { CustomerService } from "../../../services";
import { SubscriptionsType } from "../../../types/subscription";
import { CreatedSubscriptionPublisher } from "../../publishers/created-subscription.publisher";
import { CustomEventEmitter } from "../../EventEmitter";

export class PaymentListener extends Listener {
  queueName = QueueNames.PAYMENTS_CREATED;

  private static instance: PaymentListener;

  static getInstance(channel: Channel, emmitter: CustomEventEmitter) {
    if (!this.instance) {
      this.instance = new PaymentListener(channel, emmitter);
    }
    return this.instance;
  }

  private constructor(connection: any, emitter: any) {
    super(connection, emitter);
    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.emitter.on(Subjects.PAYMENTS_CREATED, (data, msg) => {
      console.log("Event received:", Subjects.PAYMENTS_CREATED);
      const isValidEventData = this.isValidEventData(
        data,
        paymentCreatedValidationSchema,
        msg
      );

      if (!isValidEventData) {
        this.channel!.nack(msg, false, false);
        return;
      }
      this.paymentCreatedEvent(data, Subjects.PAYMENTS_CREATED, msg);
    });
  }

  onMessage(
    data: PaymentCreatedEvent["body"],
    type: string,
    msg: ConsumeMessage
  ) {}

  async paymentCreatedEvent(
    data: PaymentCreatedEvent["body"],
    type: string,
    msg: ConsumeMessage
  ) {
    try {
      const {
        packageGroupId,
        customerId,
        paymentId,
        numberOfSeats,
        subscriptionStart,
        subscriptionEnd,
      } = data;
      const customerService = CustomerService.getInstance();
      const subscriptionPackage =
        await customerService.getSubscriptionPackageById(
          packageGroupId,
          customerId
        );
      if (!subscriptionPackage) {
        new ExceptionHandlerPublisher(this.channel).publish({
          messageId: uuidv4(),
          body: {
            type,
            destination: process.env.CONSUL_SERVICE,
            exception: "Subscription package not found",
            body: JSON.stringify(msg),
          },
          source: "exception-handler-service",
        });
        this.channel!.nack(msg, false, false);
        return false;
      } else if (
        subscriptionPackage.type === SubscriptionsType.GENERAL_CONSULTANCY
      ) {
        const createGeneralConsultancySubs =
          await customerService.createGeneralConsultancySubs({
            customerId,
            packageId: packageGroupId,
            paymentId,
            numberOfSeats: numberOfSeats!,
          });
        this.channel!.ack(msg);
        return createGeneralConsultancySubs;
      } else if (subscriptionPackage.type === SubscriptionsType.INMIDI_SUBS) {
        console.log("Creating inmidi subs");
        const { customerInmidiSubs, oldStartsAt } =
          await customerService.createCustomerInmidiSubs({
            customerId,
            packageId: packageGroupId,
            paymentId,
            subscriptionStart,
            subscriptionEnd,
            isActive: true,
          });
        const queueMessage = {
          customerId,
          startsAt: oldStartsAt || customerInmidiSubs.startsAt,
          endsAt: customerInmidiSubs.endsAt,
        };

        new CreatedSubscriptionPublisher(this.channel, [
          QueueNames.USER_MANAGEMENT_SERVICE,
          QueueNames.EMPLOYEE_DEMAND_SERVICE,
          QueueNames.INMIDI_REVIEW_SERVICE,
          QueueNames.APPLICANT_POOL_SERVICE,
        ]).publish({
          messageId: uuidv4(),
          type: Subjects.CREATED_SUBSCRIPTION,
          body: queueMessage,
        });
        this.channel!.ack(msg);
        return customerInmidiSubs;
      }
    } catch (error: any) {
      console.error(error);
      this.channel!.nack(msg, false, false);
      new ExceptionHandlerPublisher(this.channel).publish({
        messageId: uuidv4(),
        body: {
          type,
          destination: process.env.CONSUL_SERVICE,
          exception: error.message,
          body: JSON.stringify(msg),
        },
        source: "exception-handler-service",
      });
      return false;
    }
  }
}

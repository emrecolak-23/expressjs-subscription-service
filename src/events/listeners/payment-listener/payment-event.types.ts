import { Subjects } from "../subjects";

type DataObject = {
  [key: string]: number | string;
};

export interface PaymentEvent {
  messageId: string;
  type: Subjects.PAYMENTS_CREATED;
  body: DataObject;
}

export interface PaymentCreatedEvent {
  messageId: string;
  type: Subjects.PAYMENTS_CREATED;
  body: {
    packageGroupId: string;
    customerId: number;
    paidPrice: number;
    paymentId: string;
    subscriptionStart: Date;
    subscriptionEnd: Date;
    numberOfSeats?: number;
  };
}

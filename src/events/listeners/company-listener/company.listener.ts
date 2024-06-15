import { v4 as uuidv4 } from "uuid";
import { Channel, ConsumeMessage } from "amqplib";
import { Listener } from "../base.listener";
import { Subjects, QueueNames } from "../subjects";
import { Company } from "../../../models";
import {
  newCompanyRegisteredValidationSchema,
  companyInfoUpdatedValidationSchema,
} from "../queue-validation-schemas";
import {
  CompanyEvent,
  NewCompanyRegisteredEvent,
  CompanyInfoReviewCompletedEvent,
} from "./company-event.types";
import { ExceptionHandlerPublisher } from "../../publishers/exception-handler.publisher";
import EventEmitter from "events";

export class CompanyListener extends Listener {
  queueName = QueueNames.INMIDI_PACKAGES_SERVICE;

  private static instance: CompanyListener;

  static getInstance(channel: Channel, emitter: EventEmitter) {
    if (!this.instance) {
      this.instance = new CompanyListener(channel, emitter);
    }
    return this.instance;
  }

  private constructor(connection: any, emitter: any) {
    super(connection, emitter);
    this.setupEventListeners();
  }

  onMessage(data: CompanyEvent["body"], type: string, msg: ConsumeMessage) {}

  private setupEventListeners() {
    this.emitter.on(Subjects.NEW_COMPANY_REGISTERED, (data, msg) => {
      console.log("Event received:", Subjects.NEW_COMPANY_REGISTERED);
      const isValidEventData = this.isValidEventData(
        data,
        newCompanyRegisteredValidationSchema,
        msg
      );

      if (!isValidEventData) {
        this.channel!.nack(msg, false, false);
        return;
      }
      this.handleNewCompanyRegister(data, Subjects.NEW_COMPANY_REGISTERED, msg);
    });

    this.emitter.on(Subjects.COMPANY_INFO_UPDATED, (data, msg) => {
      console.log("Event received:", Subjects.COMPANY_INFO_UPDATED);
      const isValidEventData = this.isValidEventData(
        data,
        companyInfoUpdatedValidationSchema,
        msg
      );

      if (!isValidEventData) {
        this.channel.nack(msg, false, false);
        return;
      }
      this.handleCompanyInfoUpdatedEventCompleted(
        data,
        Subjects.COMPANY_INFO_UPDATED,
        msg
      );
    });
  }

  async handleNewCompanyRegister(
    data: NewCompanyRegisteredEvent["body"],
    type: string,
    msg: ConsumeMessage
  ) {
    try {
      const existingCompany = await Company.findOne({
        companyId: data.companyId,
      });

      if (existingCompany) {
        this.channel.ack(msg);
        return;
      }
      const newCompany = Company.build({
        companyId: data.companyId,
        companyName: data.companyName,
        authorizedPersonName: data.authorizedPersonName,
        authorizedPersonSurname: data.authorizedPersonSurname,
        authorizedPersonEmail: data.authorizedPersonEmail,
      });
      await newCompany.save();
      this.channel.ack(msg);
    } catch (error: any) {
      this.handleErrors(type, msg, error);
    }
  }

  async handleCompanyInfoUpdatedEventCompleted(
    data: CompanyInfoReviewCompletedEvent["body"],
    type: string,
    msg: ConsumeMessage
  ) {
    try {
      await Company.updateOne(
        { companyId: data.id },
        { $set: { companyName: data.name, customerInfoStatus: "ACCEPTED" } }
      );
      this.channel.ack(msg);
    } catch (error: any) {
      this.handleErrors(type, msg, error);
    }
  }

  async handleErrors(type: string, msg: ConsumeMessage, error: Error) {
    console.error(error);
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
    this.channel!.nack(msg, false, false);
  }
}

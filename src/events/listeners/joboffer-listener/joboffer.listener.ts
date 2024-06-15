import { v4 as uuidv4 } from "uuid";
import { ConsumeMessage, Channel } from "amqplib";
import { EventEmitter } from "events";
import { Listener } from "../base.listener";
import { Subjects, QueueNames } from "../subjects";
import { JobOfferEvent } from "./joboffer-event.types";
import { SeatService } from "../../../services";
import { jobOfferCreatedValidationSchema } from "../queue-validation-schemas";
import { ExceptionHandlerPublisher } from "../../publishers/exception-handler.publisher";
import { JobOfferStatus } from "../../../types/job-offer-status";
import { date } from "joi";

export class JobOfferListener extends Listener {
  queueName = QueueNames.INMIDI_PACKAGES_SERVICE;
  private static instance: JobOfferListener;

  static getInstance(
    channel: Channel,
    emitter: EventEmitter,
    seatService: SeatService
  ) {
    if (!this.instance) {
      this.instance = new JobOfferListener(channel, emitter, seatService);
    }
    return this.instance;
  }

  private constructor(
    channel: Channel,
    emitter: EventEmitter,
    private seatService: SeatService
  ) {
    super(channel, emitter);
    this.setupEventListeners();
  }

  onMessage(data: JobOfferEvent["body"], type: string, msg: ConsumeMessage) {}

  private setupEventListeners() {
    this.emitter.on(Subjects.JOB_OFFER, (data, msg) => {
      console.log("Event received:", Subjects.JOB_OFFER);
      const isValidEventData = this.isValidEventData(
        data,
        jobOfferCreatedValidationSchema,
        msg
      );
      console.log(isValidEventData, "isValidEventData");
      if (!isValidEventData) {
        this.channel!.nack(msg, false, false);
        return;
      }
      this.handleJobOfferCreated(data, Subjects.JOB_OFFER, msg);
    });
  }

  async handleJobOfferCreated(
    data: JobOfferEvent["body"],
    type: string,
    msg: ConsumeMessage
  ) {
    try {
      // Todo: Implement the logic for the event
      const {
        id,
        companyId,
        applicantName,
        date,
        status,
        supportPackageUsage,
        expirationDate,
      } = data;
      const existingJobOfferId = await this.seatService.getExistingJobOffer(
        id as number
      );

      if (existingJobOfferId) {
        await this.seatService.updateJobOfferStatus(
          id as number,
          status as JobOfferStatus
        );
      } else {
        const dateTime: number = date;
        const isoDateTime = new Date(dateTime * 1000).toISOString();
        const expirationDateTime: number = expirationDate;
        const expirationIsoDateTime = new Date(
          expirationDateTime * 1000
        ).toISOString();
        await this.seatService.createJobOffer({
          jobOfferId: id as number,
          companyId: companyId as number,
          applicantName: applicantName as string,
          dateTime: isoDateTime as unknown as Date,
          jobOfferStatus: status as JobOfferStatus,
          supportPackageUsage: supportPackageUsage ?? false,
          expirationDate: expirationIsoDateTime as unknown as Date,
        });
      }
      if (!!supportPackageUsage) {
        await this.seatService.updateSeatForGeneralConsultancySubsWithJobOfferStatus(
          companyId as number,
          id as number,
          status as JobOfferStatus
        );
      }
      console.log("Job offer created");
      this.channel.ack(msg);
    } catch (error: any) {
      console.log(error);
      this.handleErrors(type, msg, error);
    }
  }

  async handleErrors(type: string, msg: ConsumeMessage, error: Error) {
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

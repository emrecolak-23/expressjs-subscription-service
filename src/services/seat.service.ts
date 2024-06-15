import moment from "moment";
import {
  GeneralConsultancySubs,
  GeneralConsultancySubsModel,
  JobOffer,
  JobOfferModel,
} from "../models";

import { JobOfferDto } from "../dtos";
import { JobOfferStatus } from "../types/job-offer-status";

class SeatService {
  private static instance: SeatService;

  static getInstance() {
    if (!this.instance) {
      this.instance = new SeatService();
    }
    return this.instance;
  }

  jobOfferModel: JobOfferModel;
  generalConsultancySubsModel: GeneralConsultancySubsModel;
  private constructor() {
    this.jobOfferModel = JobOffer;
    this.generalConsultancySubsModel = GeneralConsultancySubs;
  }

  async createJobOffer(params: JobOfferDto) {
    const {
      jobOfferId,
      companyId,
      applicantName,
      dateTime,
      jobOfferStatus,
      expirationDate,
      supportPackageUsage,
    } = params;

    const jobOffer = this.jobOfferModel.build({
      jobOfferId,
      companyId,
      applicantName,
      jobOfferStatus,
      dateTime: moment(dateTime).toDate(),
      expirationDate: moment(expirationDate).toDate(),
      supportPackageUsage: supportPackageUsage!,
    });
    return await jobOffer.save();
  }

  async getExistingJobOffer(jobOfferId: number) {
    return await this.jobOfferModel.findOne({ jobOfferId });
  }

  async updateJobOfferStatus(
    jobOfferId: number,
    jobOfferStatus: JobOfferStatus
  ) {
    return await this.jobOfferModel.updateOne(
      { jobOfferId },
      { jobOfferStatus }
    );
  }

  async getExistingGeneralConsultancySubs(companyId: number) {
    return await this.generalConsultancySubsModel.findOne({
      customerId: companyId,
    });
  }

  async updateSeatForGeneralConsultancySubsWithJobOfferStatus(
    companyId: number,
    jobOfferId: number,
    jobOfferStatus: JobOfferStatus
  ) {
    let updateQuery = {};

    const existingGeneralConsultancy =
      await this.generalConsultancySubsModel.findOne({ customerId: companyId });

    if (!existingGeneralConsultancy) {
      return;
    }

    if (jobOfferStatus === JobOfferStatus.ACCEPTED) {
      if (
        existingGeneralConsultancy.numberOfSeats >
        existingGeneralConsultancy.usedSeats
      ) {
        updateQuery = {
          $inc: { usedSeats: 1, reservedSeats: -1 },
        };
      }
    } else if (jobOfferStatus === JobOfferStatus.WAITING_FOR_RESPONSE) {
      updateQuery = {
        $inc: { reservedSeats: 1 },
      };
    } else if (
      jobOfferStatus === JobOfferStatus.REJECTED ||
      jobOfferStatus === JobOfferStatus.WITHDRAWAL
    ) {
      if (existingGeneralConsultancy!.reservedSeats > 0) {
        updateQuery = {
          $inc: { reservedSeats: -1 },
        };
      }
    }

    return await this.generalConsultancySubsModel.updateOne(
      { customerId: companyId },
      updateQuery
    );
  }

  async getAvailableSeats(companyId: number) {
    const existingGeneranConsultancySubs =
      await this.generalConsultancySubsModel.findOne({
        customerId: companyId,
      });

    if (!existingGeneranConsultancySubs) {
      return {
        availableSeats: 0,
        hasPacket: false,
      };
    }

    const expiredJobOffers = await this.jobOfferModel.find({
      companyId,
      expirationDate: { $lt: new Date() },
      status: { $eq: "WAITING_FOR_RESPONSE" },
    });

    if (existingGeneranConsultancySubs && expiredJobOffers.length > 0) {
      const reservedSeats = expiredJobOffers.reduce(
        (acc, jobOffer) => acc + (jobOffer.supportPackageUsage ? 1 : 0),
        0
      );

      const availableSeats =
        existingGeneranConsultancySubs!.numberOfSeats -
        (existingGeneranConsultancySubs!.reservedSeats +
          existingGeneranConsultancySubs!.usedSeats);

      if (availableSeats < reservedSeats) {
        existingGeneranConsultancySubs.reservedSeats = 0;
      } else {
        existingGeneranConsultancySubs.reservedSeats -= reservedSeats;
      }

      await existingGeneranConsultancySubs.save();
      this.jobOfferModel.updateMany(
        { _id: { $in: expiredJobOffers.map((offer) => offer._id) } },
        { $set: { status: "EXPIRED" } }
      );
    }

    const availableSeats =
      existingGeneranConsultancySubs!.numberOfSeats -
      (existingGeneranConsultancySubs!.reservedSeats +
        existingGeneranConsultancySubs!.usedSeats);

    return { availableSeats, hasPacket: true };
  }
}

export { SeatService };

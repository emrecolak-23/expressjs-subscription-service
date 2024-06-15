import mongoose, { Schema, Document, Model } from "mongoose";
import { JobOfferStatus } from "../types/job-offer-status";
interface JobOfferAttrs {
  jobOfferId: number;
  companyId: number;
  applicantName: string;
  jobOfferStatus: JobOfferStatus;
  supportPackageUsage: boolean;
  expirationDate: Date;
  dateTime: Date;
}

interface JobOfferModel extends Model<JobOfferDoc> {
  build(attrs: JobOfferAttrs): JobOfferDoc;
}

interface JobOfferDoc extends Document {
  jobOfferId: number;
  companyId: number;
  applicantName: string;
  jobOfferStatus: JobOfferStatus;
  supportPackageUsage: boolean;
  expirationDate: Date;
  dateTime: Date;
}

const jobOfferSchema = new Schema(
  {
    jobOfferId: {
      type: Number,
      required: true,
      unique: true,
    },
    companyId: {
      type: Number,
      required: true,
    },
    applicantName: {
      type: String,
      required: true,
    },
    jobOfferStatus: {
      type: String,
      enum: Object.values(JobOfferStatus),
      required: true,
    },
    supportPackageUsage: {
      type: Boolean,
    },
    expirationDate: {
      type: Date,
      required: true,
    },
    dateTime: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true, versionKey: false }
);

jobOfferSchema.statics.build = (attrs: JobOfferAttrs) => {
  return new JobOffer(attrs);
};

const JobOffer = mongoose.model<JobOfferDoc, JobOfferModel>(
  "JobOffer",
  jobOfferSchema
);

export { JobOffer, JobOfferModel };

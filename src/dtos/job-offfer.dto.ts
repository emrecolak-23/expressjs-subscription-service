import { JobOfferStatus } from "../types/job-offer-status";

export interface JobOfferDto {
  jobOfferId: number;
  companyId: number;
  applicantName: string;
  jobOfferStatus: JobOfferStatus;
  supportPackageUsage?: boolean;
  dateTime: Date;
  expirationDate: Date;
}

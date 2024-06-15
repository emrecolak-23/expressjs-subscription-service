import { Subjects } from "../subjects";

type DataObject = {
  id: number;
  processId: number;
  companyId: number;
  companyName: string;
  applicantId: number;
  applicantName: string;
  status: string;
  supportPackageUsage: boolean;
  date: number;
  expirationDate: number;
};

export interface JobOfferEvent {
  messageId: string;
  type: Subjects.JOB_OFFER;
  body: DataObject;
}

export interface NewJobOfferCreatedEvent {
  messageId: string;
  type: Subjects.JOB_OFFER;
  body: DataObject;
}

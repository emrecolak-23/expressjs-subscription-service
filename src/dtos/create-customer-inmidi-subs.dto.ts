export interface CreateCustomerInmidiSubsDto {
  customerId: number;
  packageId: string;
  paymentId?: string;
  subscriptionStart: Date;
  subscriptionEnd: Date;
  isActive: boolean;
}

import {
  SubscriptionPackages,
  SubscriptionPackageModel,
  CustomerInmidiSubs,
  CustomerInmidiSubsModel,
} from "../models";
import { CreatePackageDto } from "../dtos";

class AdminService {
  private static instance: AdminService;

  static getInstance() {
    if (!this.instance) {
      this.instance = new AdminService();
    }
    return this.instance;
  }

  subscriptionModel: SubscriptionPackageModel;
  customerInmidiSubsModel: CustomerInmidiSubsModel;
  private constructor() {
    this.subscriptionModel = SubscriptionPackages;
    this.customerInmidiSubsModel = CustomerInmidiSubs;
  }

  async createSubscriptionPackage(data: CreatePackageDto) {
    const subscription = this.subscriptionModel.build(data);
    return await subscription.save();
  }

  async getInmidiSubsWithDateRange(startsAt: Date, endsAt: Date) {
    const pipeline = [
      {
        $match: {
          createdAt: {
            $lt: new Date(endsAt),
            $gt: new Date(startsAt),
          },
        },
      },
      {
        $group: {
          _id: "$customerId",
          startsAt: {
            $push: "$startsAt",
          },
          endsAt: {
            $push: "$endsAt",
          },
        },
      },
    ];

    const inmidiSubs = await this.customerInmidiSubsModel.aggregate(pipeline);

    return inmidiSubs;
  }
}

export { AdminService };

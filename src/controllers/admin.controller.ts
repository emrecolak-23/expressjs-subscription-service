import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { AdminService } from "../services";
import { CreatedSubscriptionPublisher } from "../events/publishers/created-subscription.publisher";
import { QueueNames } from "../events/listeners/subjects";
import { channel } from "..";
import { Subjects } from "../events/listeners/subjects";

class AdminController {
  private static instance: AdminController;

  static getInstance(adminService: AdminService) {
    if (!this.instance) {
      this.instance = new AdminController(adminService);
    }
    return this.instance;
  }

  private constructor(private adminService: AdminService) {}

  createSubscriptionPackage = async (req: Request, res: Response) => {
    const subscriptionPackage =
      await this.adminService.createSubscriptionPackage(req.body);
    res.status(201).json(subscriptionPackage);
  };

  syncSubscriptionPackage = async (req: Request, res: Response) => {
    const { startsAt, endsAt } = req.body;

    const inmidiSubs = await this.adminService.getInmidiSubsWithDateRange(
      startsAt,
      endsAt
    );

    await Promise.all(
      inmidiSubs.map(async (subs) => {
        const { _id, startsAt, endsAt } = subs;
        const sortedStartsArr = startsAt
          .slice()
          .sort(
            (a: string, b: string) =>
              new Date(a).getTime() - new Date(b).getTime()
          );
        const sortedEndsArr = endsAt
          .slice()
          .sort(
            (a: string, b: string) =>
              new Date(b).getTime() - new Date(a).getTime()
          );

        new CreatedSubscriptionPublisher(channel, [
          QueueNames.USER_MANAGEMENT_SERVICE,
          QueueNames.EMPLOYEE_DEMAND_SERVICE,
          QueueNames.INMIDI_REVIEW_SERVICE,
          QueueNames.APPLICANT_POOL_SERVICE,
        ]).publish({
          messageId: uuidv4(),
          type: Subjects.CREATED_SUBSCRIPTION,
          body: {
            customerId: _id,
            startsAt: sortedStartsArr[0],
            endsAt: sortedEndsArr[0],
          },
        });

        console.log(sortedStartsArr[0], sortedEndsArr[0]);
        console.log("Customer ID:", _id);
      })
    );

    res.status(200).json({ data: inmidiSubs });
  };
}

export { AdminController };

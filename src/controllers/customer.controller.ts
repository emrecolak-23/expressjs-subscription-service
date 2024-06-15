import { v4 as uuidv4 } from "uuid";
import moment from "moment";
import { Request, Response } from "express";
import { CustomerService } from "../services";
import { NotFoundError } from "../errors/not-found-error";
import { BadRequestError } from "../errors/bad-request-error";
import { SubscriptionCreatedPublisher } from "../events/publishers/subscription-created.publisher";
import { channel } from "..";
import { i18n } from "../middlewares";
import { SubscriptionTitle } from "../types/subscription";
import { FlattenMaps, ObjectId } from "mongoose";
import { CustomerInmidiSubsDoc } from "../models";

class CustomerController {
  private static instance: CustomerController;

  static getInstance(customerService: CustomerService) {
    if (!this.instance) {
      this.instance = new CustomerController(customerService);
    }
    return this.instance;
  }

  private constructor(private customerService: CustomerService) {}

  getSubscriptionPackages = async (req: Request, res: Response) => {
    const customerId = req.currentUser.id;
    let subscriptionPackages =
      await this.customerService.getSubscriptionPackages(customerId);

    if (!subscriptionPackages) {
      throw new NotFoundError(i18n.__("subscription_packages_not_found"));
    }

    subscriptionPackages = await Promise.all(
      subscriptionPackages?.map((subscriptionPackage) => {
        return this.customerService.getTranslatedPackage(
          subscriptionPackage,
          req.headers["accept-language"] as string
        );
      })
    );

    res.status(200).json(subscriptionPackages);
  };

  getSubscriptionPackage = async (req: Request, res: Response) => {
    const { id: subscriptionId } = req.params;
    const { id: customerId } = req.currentUser;
    const acceptLanguage = req.headers["accept-language"] as string;

    let subscriptionPackage =
      await this.customerService.getSubscriptionPackageById(
        subscriptionId,
        customerId
      );

    if (!subscriptionPackage) {
      throw new NotFoundError(i18n.__("subscription_package_not_found"));
    }

    subscriptionPackage = await this.customerService.getTranslatedPackage(
      subscriptionPackage,
      acceptLanguage
    );

    res.status(200).json(subscriptionPackage);
  };

  getRecentInmidiSubs = async (req: Request, res: Response) => {
    const { id: customerId } = req.currentUser;
    const acceptLanguage = req.headers["accept-language"] as string;
    let recentInmidiSubs =
      (await this.customerService.getRecentInmidiSubsByCustomerId(
        customerId
      )) as
        | (FlattenMaps<CustomerInmidiSubsDoc> & {
            _id: ObjectId;
            packageId: { title: string; type: string };
          })
        | null;

    if (!recentInmidiSubs) {
      return res.status(200).json({});
    }

    const subsFormatted = {
      title: recentInmidiSubs.packageId.title,
      type: recentInmidiSubs.packageId.type,
      endsAt: recentInmidiSubs.endsAt,
    };

    const translatedSubs = await this.customerService.getTranslatedPackage(
      subsFormatted,
      acceptLanguage
    );

    res.status(200).json({
      title: translatedSubs?.title,
      type: translatedSubs?.type,
      endsAt: translatedSubs?.endsAt,
    });
  };

  getAllCustomerInmidiSubs = async (req: Request, res: Response) => {
    const customerId = req.currentUser.id;
    const customerInmidiSubs =
      await this.customerService.getAllCustomerInmidiSubsByCustomerId(
        customerId
      );
    res.status(200).json(customerInmidiSubs);
  };

  getCustomerInmidiSubsById = async (req: Request, res: Response) => {
    const customerId = req.currentUser.id;
    const customerInmidiSubsId = req.params.id;

    const customerInmidiSubs =
      await this.customerService.getCustomerInmidiSubsById(
        customerId,
        customerInmidiSubsId
      );

    if (!customerInmidiSubs) {
      throw new NotFoundError(i18n.__("customer_subscription_not_found"));
    }

    res.status(200).json(customerInmidiSubs);
  };

  createGeneralConsultancySubs = async (req: Request, res: Response) => {
    const { packageId, durationType, numberOfSeats } = req.body;
    const { id: customerId } = req.currentUser;

    const subscriptionPackage =
      await this.customerService.getSubscriptionPackageById(
        packageId,
        customerId
      );

    if (!subscriptionPackage) {
      throw new NotFoundError(i18n.__("subscription_package_not_found"));
    }

    const customerInmidiSubs =
      await this.customerService.createGeneralConsultancySubs({
        customerId,
        packageId,
        numberOfSeats,
      });

    if (!customerInmidiSubs) {
      throw new BadRequestError(i18n.__("customer_subscription_not_created"));
    }

    new SubscriptionCreatedPublisher(channel, ["payments-service"]).publish({
      messageId: uuidv4(),
      type: "NEW_SUBSCRIPTION_CREATED",
      body: {
        subscriptionId: customerInmidiSubs.id,
        packageGroupId: subscriptionPackage._id,
        paidPrice: subscriptionPackage.price,
        customerId,
      },
    });

    res.status(201).json(customerInmidiSubs);
  };

  getAllGeneralConsultancySubs = async (req: Request, res: Response) => {
    const customerId = req.currentUser.id;
    const customerInmidiSubs =
      await this.customerService.getAllGeneralConsultancySubsByCustomerId(
        customerId
      );
    res.status(200).json(customerInmidiSubs);
  };

  getGeneralConsultancySubsById = async (req: Request, res: Response) => {
    const customerId = req.currentUser.id;
    const customerInmidiSubsId = req.params.id;

    const customerInmidiSubs =
      await this.customerService.getGeneralConsultancySubsById(
        customerId,
        customerInmidiSubsId
      );

    if (!customerInmidiSubs) {
      throw new NotFoundError(i18n.__("customer_subscription_not_found"));
    }

    res.status(200).json(customerInmidiSubs);
  };

  getAllJobOffers = async (req: Request, res: Response) => {
    const { id: customerId } = req.currentUser;
    const { page = 1, pageSize = 10 } = req.body;

    const jobOffers = await this.customerService.listAllJobOffers(
      customerId,
      page,
      pageSize
    );

    res.status(200).json(jobOffers);
  };

  getSubscriptions = async (req: Request, res: Response) => {
    const { id: customerId } = req.currentUser;
    const recentInmidiSubs =
      (await this.customerService.getRecentInmidiSubsByCustomerId(
        customerId
      )) as SubscriptionTitle | null;

    const acceptLanguage = req.headers["accept-language"] as string;

    let packages: {
      _id: string;
      title: string;
      type: string;
      dayCreationDiff: number;
    }[] = [];
    if (recentInmidiSubs) {
      packages.push({
        _id: recentInmidiSubs.packageId._id,
        type: recentInmidiSubs.packageId.type,
        title: recentInmidiSubs.packageId.title,
        dayCreationDiff: moment().diff(recentInmidiSubs.createdAt, "days"),
      });
    }

    const recentGeneralConsultancySubs =
      (await this.customerService.getRecentGeneralConsultancySubsByCustomerId(
        customerId
      )) as SubscriptionTitle | null;

    if (recentGeneralConsultancySubs) {
      packages.push({
        _id: recentGeneralConsultancySubs.packageId._id,
        type: recentGeneralConsultancySubs.packageId.type,
        title: recentGeneralConsultancySubs.packageId.title,
        dayCreationDiff: moment().diff(
          recentGeneralConsultancySubs.createdAt,
          "days"
        ),
      });
    }

    packages = await Promise.all(
      packages.map((p) => {
        return this.customerService.getTranslatedPackage(p, acceptLanguage);
      })
    );

    res.status(200).json(packages);
  };
}

export { CustomerController };

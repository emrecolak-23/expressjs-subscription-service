import moment from "moment";
import {
  SubscriptionPackages,
  SubscriptionPackageModel,
  CustomerInmidiSubs,
  CustomerInmidiSubsModel,
  CompanyModel,
  Company,
  GeneralConsultancySubs,
  GeneralConsultancySubsModel,
  JobOffer,
  JobOfferModel,
} from "../models";

import { consulInstance } from "..";

import {
  CreateCustomerInmidiSubsDto,
  CreateGeneralConsultancySubsDto,
} from "../dtos";

import { SubscriptionsType } from "../types/subscription";

class CustomerService {
  private static instance: CustomerService;
  static getInstance() {
    if (!this.instance) {
      this.instance = new CustomerService();
    }
    return this.instance;
  }

  private subscriptionModel: SubscriptionPackageModel;
  private customerInmidiSubsModel: CustomerInmidiSubsModel;
  private companyModel: CompanyModel;
  private generalConsultancySubsModel: GeneralConsultancySubsModel;
  private jobOfferModel: JobOfferModel;
  private constructor() {
    this.subscriptionModel = SubscriptionPackages;
    this.customerInmidiSubsModel = CustomerInmidiSubs;
    this.companyModel = Company;
    this.generalConsultancySubsModel = GeneralConsultancySubs;
    this.jobOfferModel = JobOffer;
  }

  async getSubscriptionPackages(companyId: number) {
    const customer = await this.companyModel.findOne({ companyId });
    const existingInmidiSubs =
      await this.getCurrentActiveCustomerInmidiSubsByCustomerId(companyId);

    if (!customer) {
      return null;
    }

    const subscriptionPackages = await this.subscriptionModel
      .find(
        { status: true },
        {
          title: 1,
          price: 1,
          durationType: 1,
          banner: 1,
          discount: 1,
          isSeatable: 1,
          type: 1,
          icon: 1,
          explanation: 1,
        }
      )
      .lean();
    return subscriptionPackages.map((subscriptionPackage: any) => {
      const yearlyPrice =
        subscriptionPackage.price * 12 -
        (subscriptionPackage.price * 12 * subscriptionPackage.discount) / 100;
      const formattedYearlyPrice = parseInt(yearlyPrice.toFixed(2));
      const discount = subscriptionPackage.discount;
      delete subscriptionPackage.discount;

      return {
        ...subscriptionPackage,
        isPurchaseable:
          subscriptionPackage.type === SubscriptionsType.INMIDI_SUBS &&
          existingInmidiSubs
            ? false
            : true,
        price: {
          normalPrice: subscriptionPackage.price,
          yearlyPrice:
            subscriptionPackage.type === SubscriptionsType.GENERAL_CONSULTANCY
              ? 0
              : formattedYearlyPrice,
          discount:
            subscriptionPackage.type === SubscriptionsType.GENERAL_CONSULTANCY
              ? 0
              : discount,
          currency: "EU",
          currencyPrefix: "€",
        },
      };
    });
  }

  async getSubscriptionPackageById(id: string, companyId: number) {
    const existingInmidiSubs =
      await this.getCurrentActiveCustomerInmidiSubsByCustomerId(companyId);

    const subscriptionPackage = await this.subscriptionModel
      .findById(id)
      .lean();
    if (!subscriptionPackage) {
      return null;
    }
    const yearlyPrice =
      subscriptionPackage.price * 12 -
      (subscriptionPackage.price * 12 * subscriptionPackage.discount) / 100;
    const formattedYearlyPrice = parseInt(yearlyPrice.toFixed(2));
    const discount = subscriptionPackage.discount;
    return {
      ...subscriptionPackage,
      discount: undefined,
      isPurchaseable:
        subscriptionPackage.type === SubscriptionsType.INMIDI_SUBS &&
        existingInmidiSubs
          ? false
          : true,
      price: {
        normalPrice: subscriptionPackage.price,
        yearlyPrice:
          subscriptionPackage.type === "GENERAL_CONSULTANCY"
            ? 0
            : formattedYearlyPrice,
        discount:
          subscriptionPackage.type === "GENERAL_CONSULTANCY" ? 0 : discount,
        currency: "EU",
        currencyPrefix: "€",
      },
    };
  }

  async createCustomerInmidiSubs(params: CreateCustomerInmidiSubsDto) {
    const subscriptionStartsAt = moment(params.subscriptionStart)
      .utc()
      .startOf("day")
      .toDate();
    const subscriptionEndsAt = moment(params.subscriptionEnd)
      .utc()
      .endOf("day")
      .toDate();

    console.log(
      subscriptionEndsAt,
      subscriptionStartsAt,
      "subscriptionEndsAt",
      "subscriptionStartsAt"
    );

    const existingInmidiSubs = await this.customerInmidiSubsModel.findOne({
      customerId: params.customerId,
      isActive: true,
      endsAt: { $eq: subscriptionEndsAt },
      startsAt: { $eq: subscriptionStartsAt },
    });

    console.log(existingInmidiSubs, "existingInmidiSubs");

    if (existingInmidiSubs) {
      return {
        customerInmidiSubs: existingInmidiSubs,
        oldStartsAt: null,
      };
    }

    const existingCustomerInmidiSubs =
      await this.getCustomerInmidiSubsByCustomerId(params.customerId);

    const customerInmidiSubsInput = {
      customerId: params.customerId,
      packageId: params.packageId,
      isActive: params.isActive,
      startsAt: subscriptionStartsAt,
      endsAt: subscriptionEndsAt,
      paymentId: params.paymentId,
    };

    const customerInmidiSubs = this.customerInmidiSubsModel.build(
      customerInmidiSubsInput
    );
    await customerInmidiSubs.save();

    return {
      customerInmidiSubs,
      oldStartsAt:
        existingCustomerInmidiSubs && existingCustomerInmidiSubs.length > 0
          ? existingCustomerInmidiSubs[0].startsAt
          : null,
    };
  }

  async getCustomerInmidiSubsByCustomerId(customerId: number) {
    const customerInmidiSubs = await this.customerInmidiSubsModel
      .find({ customerId, isActive: true })
      .populate({
        path: "packageId",
        select: "title",
      })
      .lean();

    if (!customerInmidiSubs) {
      return null;
    }

    return customerInmidiSubs;
  }

  async getRecentInmidiSubsEndsAtByCustomerId(customerId: number) {
    const customerInmidiSubs = await this.customerInmidiSubsModel
      .find({ customerId, isActive: true })
      .sort({ endsAt: -1 })
      .limit(1)
      .lean();

    if (!customerInmidiSubs.length) {
      return null;
    }

    return customerInmidiSubs[0];
  }

  async getAllCustomerInmidiSubsByCustomerId(customerId: number) {
    const customerInmidiSubs = await this.customerInmidiSubsModel
      .find({ customerId })
      .populate({
        path: "packageId",
        select: "title",
      })
      .lean();

    if (!customerInmidiSubs.length) {
      return null;
    }

    return customerInmidiSubs;
  }

  async getCurrentActiveCustomerInmidiSubsByCustomerId(customerId: number) {
    const customerInmidiSubs = await this.customerInmidiSubsModel.findOne({
      customerId,
      isActive: true,
      endsAt: { $gte: new Date() },
    });

    return customerInmidiSubs;
  }

  async getCustomerInmidiSubsById(
    customerId: number,
    customerInmidiSubsId: string
  ) {
    const customerInmidiSubs = await this.customerInmidiSubsModel
      .findOne({ customerId, _id: customerInmidiSubsId })
      .populate({
        path: "packageId",
        select: "title",
      })
      .lean();

    if (!customerInmidiSubs) {
      return null;
    }

    return customerInmidiSubs;
  }

  async createGeneralConsultancySubs(params: CreateGeneralConsultancySubsDto) {
    const existingGeneralConsultancySubs =
      await this.getGeneralConsultancySubsByCustomerId(params.customerId);

    if (existingGeneralConsultancySubs) {
      const updatedGeneralConsultancySubs =
        await this.generalConsultancySubsModel.findByIdAndUpdate(
          existingGeneralConsultancySubs._id,
          {
            numberOfSeats:
              existingGeneralConsultancySubs.numberOfSeats +
              params.numberOfSeats,
            $push: { paymentId: params.paymentId! },
          }
        );

      return updatedGeneralConsultancySubs;
    }

    const generalConsultancySubInput = {
      customerId: params.customerId,
      packageId: params.packageId,
      status: true,
      numberOfSeats: params.numberOfSeats,
      paymentId: [params.paymentId!],
    };

    const generalConsultancySubs = this.generalConsultancySubsModel.build(
      generalConsultancySubInput
    );
    await generalConsultancySubs.save();
    return generalConsultancySubs;
  }

  async getGeneralConsultancySubsByCustomerId(customerId: number) {
    const generalConsultancySubs = await this.generalConsultancySubsModel
      .findOne({ customerId, status: true })
      .populate({
        path: "packageId",
        select: "title",
      })
      .lean();

    if (!generalConsultancySubs) {
      return null;
    }

    return generalConsultancySubs;
  }

  async getAllGeneralConsultancySubsByCustomerId(customerId: number) {
    const customerInmidiSubs = await this.generalConsultancySubsModel
      .find({ customerId })
      .populate({
        path: "packageId",
        select: "title",
      })
      .lean();

    if (!customerInmidiSubs.length) {
      return null;
    }

    return customerInmidiSubs;
  }

  async getGeneralConsultancySubsById(
    customerId: number,
    generalConsultancySubsId: string
  ) {
    const customerInmidiSubs = await this.generalConsultancySubsModel
      .findOne({ customerId, _id: generalConsultancySubsId })
      .populate({
        path: "packageId",
        select: "title",
      })
      .lean();
    console.log(customerInmidiSubs, "customerInmidiSubs");
    if (!customerInmidiSubs) {
      return null;
    }

    return customerInmidiSubs;
  }

  async listAllJobOffers(
    companyId: number,
    page: number = 1,
    pageSize: number = 10
  ) {
    const skip = (page - 1) * pageSize;

    const jobOffers = await this.jobOfferModel
      .find({ companyId, supportPackageUsage: true })
      .skip(skip)
      .limit(pageSize)
      .lean();

    return jobOffers;
  }

  async getRecentInmidiSubsByCustomerId(customerId: number) {
    const customerInmidiSubs = await this.customerInmidiSubsModel
      .find({ customerId }, { createdAt: 1, packageId: 1, endsAt: 1 })
      .sort({ createdAt: -1 })
      .populate({ path: "packageId", select: "title type" })
      .limit(1)
      .lean();

    if (!customerInmidiSubs.length) {
      return null;
    }

    return customerInmidiSubs[0];
  }

  async getRecentGeneralConsultancySubsByCustomerId(customerId: number) {
    const generalConsultancySubs = await this.generalConsultancySubsModel
      .find({ customerId }, { createdAt: 1, packageId: 1 })
      .sort({ createdAt: -1 })
      .populate({ path: "packageId", select: "title type" })
      .limit(1)
      .lean();

    if (!generalConsultancySubs.length) {
      return null;
    }

    return generalConsultancySubs[0];
  }

  async getTranslatedPackage(subscription: any, acceptLanguage: string) {
    const kvConfig = `config/inmidi-packages/${subscription?.type}/${acceptLanguage}`;

    const consulClient = consulInstance.getConsulClient();
    const translatedPackage = await consulClient.kv.get(kvConfig);
    const resultTranslatedPackage = translatedPackage?.Value
      ? JSON.parse(translatedPackage.Value)
      : null;

    return {
      ...subscription,
      ...(subscription?.title && {
        title: resultTranslatedPackage?.title || subscription.title,
      }),
      ...(subscription?.explanation && {
        explanation:
          resultTranslatedPackage?.explanation || subscription.explanation,
      }),
      ...(subscription?.details && {
        details: resultTranslatedPackage?.details || subscription.details,
      }),
      ...(subscription?.properties && {
        properties:
          resultTranslatedPackage?.properties || subscription.properties,
      }),
      ...(subscription.banner && {
        banner: resultTranslatedPackage?.banner || subscription.banner,
      }),
    };
  }
}

export { CustomerService };

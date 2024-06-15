import express, { Router } from "express";

import { CustomerController } from "../controllers";
import { CustomerService } from "../services";
import { requireAuth, currentUser, validate } from "../middlewares";
import {
  createCustomerInmidiSubs,
  createGeneralConsultancySubs,
} from "../validations";
import { isCustomer } from "../guards";

function customerPackagesRoutes(): Router {
  const router = express.Router();

  const customerService = CustomerService.getInstance();
  const customerController = CustomerController.getInstance(customerService);

  router.use(currentUser, requireAuth, isCustomer);

  router.get(
    "/subscription-package",
    customerController.getSubscriptionPackages.bind(customerController)
  );
  router.get(
    "/subscription-package/:id",
    customerController.getSubscriptionPackage.bind(customerController)
  );

  router.get(
    "/inmidi-customer-subs",
    customerController.getAllCustomerInmidiSubs.bind(customerController)
  );
  router.get(
    "/inmidi-customer-subs/:id",
    customerController.getCustomerInmidiSubsById.bind(customerController)
  );
  router.post(
    "/general-consultancy-subs",
    validate(createGeneralConsultancySubs),
    customerController.createGeneralConsultancySubs.bind(customerController)
  );
  router.get(
    "/general-consultancy-subs",
    customerController.getAllGeneralConsultancySubs.bind(customerController)
  );
  router.get(
    "/general-consultancy-subs/:id",
    customerController.getGeneralConsultancySubsById.bind(customerController)
  );
  router.post(
    "/job-offers",
    customerController.getAllJobOffers.bind(customerController)
  );

  router.get(
    "/list-subscriptions-title",
    customerController.getSubscriptions.bind(customerController)
  );

  router.get(
    "/recent-inmidi-subs",
    customerController.getRecentInmidiSubs.bind(customerController)
  );

  return router;
}

export { customerPackagesRoutes };

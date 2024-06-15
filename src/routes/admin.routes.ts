import express, { Router } from "express";

import { AdminController } from "../controllers";
import { AdminService } from "../services";
import { currentUser, requireAuth } from "../middlewares";
import { isAdmin } from "../guards";

function adminPackagesRoutes(): Router {
  const router = express.Router();

  const adminService = AdminService.getInstance();
  const adminController = AdminController.getInstance(adminService);
  router.use(currentUser, requireAuth, isAdmin);

  router.post(
    "/subscription-package",
    adminController.createSubscriptionPackage.bind(adminController)
  );

  router.post(
    "/sync-subscription-package",
    adminController.syncSubscriptionPackage.bind(adminController)
  );

  return router;
}

export { adminPackagesRoutes };

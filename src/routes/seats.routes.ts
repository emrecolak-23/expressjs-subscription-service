import expess, { Router } from "express";

import { SeatController } from "../controllers";
import { SeatService } from "../services";
import { currentUser, requireAuth } from "../middlewares";

function seatRoutes(): Router {
  const router = expess.Router();
  const seatService = SeatService.getInstance();
  const seatController = SeatController.getInstance(seatService);
  router.use(currentUser, requireAuth);

  router.get("/available-seats", seatController.getAvailableSeats);

  return router;
}

export { seatRoutes };

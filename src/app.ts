import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import "express-async-errors";
import * as amqp from "amqplib";
import mongoose from "mongoose";

import { UserPayload } from "./types/user";

// Import Routes
import {
  adminPackagesRoutes,
  customerPackagesRoutes,
  seatRoutes,
} from "./routes";

// Import Middlewares
import { errorHandler } from "./middlewares";

// Import Errors
import { NotFoundError } from "./errors/not-found-error";

if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: path.join(__dirname, "../.env.dev") });
} else {
  dotenv.config({ path: path.resolve(__dirname, ".env") });
}

declare global {
  namespace Express {
    interface Request {
      currentUser: UserPayload;
      language: string;
      token: string;
    }
  }
}

const app = express();
app.use(express.json());
app.use(cors());

app.get("/inmidi-packages/healthcheck", async (req: Request, res: Response) => {
  const healtStatus: Record<string, string> = { status: "OK" };
  try {
    const connection = await amqp.connect(process.env.AMQP_URI!);
    healtStatus.amqp = "OK";
    connection.close();
  } catch (error) {
    healtStatus.amqp = "FAILED";
    res.status(500).json(healtStatus);
  }

  try {
    await mongoose.connection.db.admin().ping();
    healtStatus.mongoDB = "OK";
  } catch (error) {
    console.log(error);
    healtStatus.mongoDB = "NOT OK";
    res.status(500).json(healtStatus);
  }
  res.status(200).json(healtStatus);
});

app.use("/inmidi-backoffice", adminPackagesRoutes());
app.use("/inmidi", customerPackagesRoutes());
app.use("/seats", seatRoutes());

app.all("*", (req: Request, res: Response, next: NextFunction) => {
  console.log("Route not found");
  throw new NotFoundError("route_not_found");
});

app.use(errorHandler);

export { app };

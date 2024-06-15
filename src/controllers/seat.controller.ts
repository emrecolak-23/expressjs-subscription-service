import { Request, Response } from "express";
import { SeatService } from "../services";
class SeatController {
  private static instance: SeatController;
  static getInstance(seatService: SeatService) {
    if (!this.instance) {
      this.instance = new SeatController(seatService);
    }
    return this.instance;
  }

  private constructor(private seatService: SeatService) {}

  getAvailableSeats = async (req: Request, res: Response) => {
    const { id: companyId } = req.currentUser;
    const availableSeats = await this.seatService.getAvailableSeats(companyId);

    res.status(200).json(availableSeats);
  };
}

export { SeatController };

import { EventEmitter } from "events";

export class CustomEventEmitter extends EventEmitter {
  private static instance: CustomEventEmitter;

  static getInstance() {
    if (!this.instance) {
      this.instance = new CustomEventEmitter();
    }

    return this.instance;
  }
}

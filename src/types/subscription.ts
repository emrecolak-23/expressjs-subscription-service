export enum SubscriptionsType {
  INMIDI_SUBS = "INMIDI_SUBS",
  GENERAL_CONSULTANCY = "GENERAL_CONSULTANCY",
}

export interface SubscriptionTitle {
  createdAt: Date;
  packageId: { _id: string; title: string; type: string };
}

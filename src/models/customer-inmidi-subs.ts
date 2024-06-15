import mongoose, { Schema, Document, Model } from "mongoose";

interface CustomerInmidiSubsAttrs {
  customerId: number;
  packageId: string;
  isActive: boolean;
  paymentId?: string;
  startsAt: Date;
  endsAt: Date;
}

export interface CustomerInmidiSubsDoc extends Document {
  customerId: number;
  packageId: string;
  isActive: boolean;
  paymentId?: string;
  startsAt: Date;
  endsAt: Date;
}

interface CustomerInmidiSubsModel extends Model<CustomerInmidiSubsDoc> {
  build(attrs: CustomerInmidiSubsAttrs): CustomerInmidiSubsDoc;
}

const customerInmidiSubsSchema = new Schema(
  {
    customerId: {
      type: Number,
      required: true,
    },
    packageId: {
      type: Schema.Types.ObjectId,
      ref: "Subscription-Package",
      required: true,
    },
    paymentId: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    startsAt: {
      type: Date,
      required: true,
    },
    endsAt: {
      type: Date,
      required: true,
    },
  },
  {
    toJSON: {
      transform(doc, ret) {
        delete ret.createdAt;
        delete ret.updatedAt;
      },
    },
    timestamps: true,
    versionKey: false,
  }
);

customerInmidiSubsSchema.statics.build = (attrs: CustomerInmidiSubsAttrs) => {
  return new CustomerInmidiSubs(attrs);
};

const CustomerInmidiSubs = mongoose.model<
  CustomerInmidiSubsDoc,
  CustomerInmidiSubsModel
>("Customer-Inmidi-Subs", customerInmidiSubsSchema);

export { CustomerInmidiSubs, CustomerInmidiSubsModel };

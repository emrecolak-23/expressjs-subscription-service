import mongoose, { Schema, Model, Document } from "mongoose";

interface GeneralConsultancySubsAttrs {
  customerId: number;
  packageId: string;
  status: boolean;
  numberOfSeats: number;
  paymentId?: string[];
}

interface GeneralConsultancySubsDoc extends Document {
  customerId: number;
  packageId: string;
  status: boolean;
  numberOfSeats: number;
  usedSeats: number;
  reservedSeats: number;
  paymentId?: string[];
}

interface GeneralConsultancySubsModel extends Model<GeneralConsultancySubsDoc> {
  build(attrs: GeneralConsultancySubsAttrs): GeneralConsultancySubsDoc;
}

const generalConsultancySubsSchema = new Schema(
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
    status: {
      type: Boolean,
      required: true,
      default: true,
    },
    numberOfSeats: {
      type: Number,
      required: true,
    },
    usedSeats: {
      type: Number,
      default: 0,
    },
    reservedSeats: {
      type: Number,
      default: 0,
    },
    paymentId: {
      type: Array,
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

generalConsultancySubsSchema.statics.build = (
  attrs: GeneralConsultancySubsAttrs
) => {
  return new GeneralConsultancySubs(attrs);
};

const GeneralConsultancySubs = mongoose.model<
  GeneralConsultancySubsDoc,
  GeneralConsultancySubsModel
>("General-Consultancy-Subs-Inmidi", generalConsultancySubsSchema);

export { GeneralConsultancySubs, GeneralConsultancySubsModel };

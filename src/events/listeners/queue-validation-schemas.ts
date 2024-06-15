export const newCompanyRegisteredValidationSchema = {
  type: "object",
  properties: {
    id: { type: "number" },
    companyId: { type: "number" },
    companyName: { type: "string" },
    authorizedPersonName: { type: "string" },
    authorizedPersonSurname: { type: "string" },
    authorizedPersonEmail: { type: "string" },
  },
  required: [
    "companyId",
    "companyName",
    "authorizedPersonName",
    "authorizedPersonSurname",
    "authorizedPersonEmail",
  ],
  additionalProperties: false,
};

export const companyInfoUpdatedValidationSchema = {
  type: "object",
  properties: {
    id: { type: "number" },
    name: { type: "string" },
  },
  required: ["id", "name"],
  additionalProperties: false,
};

export const paymentCreatedValidationSchema = {
  type: "object",
  properties: {
    packageGroupId: { type: "string" },
    customerId: { type: "number" },
    paymentId: { type: "string" },
    numberOfSeats: { type: "number" },
    subscriptionStart: { type: "string" },
    subscriptionEnd: { type: "string" },
  },
  required: ["paymentId", "packageGroupId", "customerId"],
  additionalProperties: false,
};

export const jobOfferCreatedValidationSchema = {
  type: "object",
  properties: {
    id: { type: "number" },
    processId: { type: "number" },
    companyId: { type: "number" },
    companyName: { type: "string" },
    applicantId: { type: "number" },
    applicantName: { type: "string" },
    status: { type: "string" },
    supportPackageUsage: { type: "boolean" },
    date: { type: "number" },
    expirationDate: { type: "number" },
  },
  required: [
    "id",
    "processId",
    "companyId",
    "companyName",
    "applicantId",
    "applicantName",
    "status",
    "supportPackageUsage",
    "date",
    "expirationDate",
  ],
  additionalProperties: false,
};

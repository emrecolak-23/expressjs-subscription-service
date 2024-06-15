import Joi from "joi";


const createCustomerInmidiSubs = Joi.object({
    packageId: Joi.string().required(),
    durationType: Joi.number().min(1).max(12).required()
})

const createGeneralConsultancySubs = Joi.object({
    packageId: Joi.string().required(),
    durationType: Joi.number().min(1).max(12).required(),
    numberOfSeats: Joi.number().min(1).required()
})


export { createCustomerInmidiSubs, createGeneralConsultancySubs }
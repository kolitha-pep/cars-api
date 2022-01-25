const baseJoi = require('joi');
const extension = require('joi-date-extensions');

const Joi = baseJoi.extend(extension);

const newCarValidateSchema = Joi.object().keys({
  seller_type: Joi.string().allow(null).allow(''),
  seller_name: Joi.string().required(),
  phone_number: Joi.string().required(),
  year: Joi.number(),
  make: Joi.string(),
  model: Joi.string(),
  vin: Joi.string().allow(null).allow(''),
  mileage: Joi.number(),
  features: Joi.string().allow(null).allow(''),
  location: Joi.string().allow(null).allow(''),
  is_vehicle_titled: Joi.boolean(),
  is_there_lienholder: Joi.boolean(),
  title_status: Joi.string().allow(null).allow(''),
  billing_type: Joi.string().required(),
  reserve_price: Joi.number().allow(null),
  photos: Joi.array()
});


module.exports = {
  newCarValidateSchema,
};

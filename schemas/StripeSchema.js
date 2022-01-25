const baseJoi = require('joi');
const extension = require('joi-date-extensions');
const Joi = baseJoi.extend(extension);

const newCardValidateSchema = Joi.object().keys({
  number: Joi.string().required(),
  exp_month: Joi.string().required(),
  exp_year: Joi.string().required(),
  cvc: Joi.string().required(),
  name: Joi.string().required(),
});

module.exports = {
  newCardValidateSchema
};

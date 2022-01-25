const baseJoi = require('joi');
const extension = require('joi-date-extensions');
const ConstantsService = require('../services/ConstantsService');

const Joi = baseJoi.extend(extension);

const loginValidateSchema = Joi.object().keys({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const signUpValidateSchema = Joi.object().keys({
  email: Joi.string().email().required(),
  user_name: Joi.string().required(),
  password: Joi.string().min(8).max(20).required(),
  confirm_password: Joi.string().valid(Joi.ref('password')).required().options({ language: { any: { allowOnly: 'must match with password' } } })
});

const resetPasswordValidateSchema = Joi.object().keys({
  current_password: Joi.string().required(),
  new_password: Joi.string().min(8).max(20).required(),
  confirm_password: Joi.string().valid(Joi.ref('new_password')).required().options({ language: { any: { allowOnly: 'must match with new password' } } })
});

const forgotPasswordValidateSchema = Joi.object().keys({
  email: Joi.string().email().required()
});

module.exports = {
  loginValidateSchema,
  signUpValidateSchema,
  resetPasswordValidateSchema,
  forgotPasswordValidateSchema
};

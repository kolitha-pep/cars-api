const config = require('config');
const baseJoi = require('joi');
const extension = require('joi-date-extensions');
const _ = require('lodash');
const stripe = require('stripe')(config.STRIPE_KEY);
const log = require('simple-node-logger').createSimpleLogger();

const Joi = baseJoi.extend(extension);
const ConstantsService = require('./ConstantsService');
const { newCardValidateSchema } = require('../schemas/StripeSchema');

const StripeService = {

  createCard: async (request, user) => {

    if (!user.stripe_customer) {
      throw new Error('Cannot create card for this user');
    }
    const validation = Joi.validate(request, newCardValidateSchema);
    if (validation.error) {
      let errorMessage = validation.error.details.shift();
      errorMessage = errorMessage.message || ConstantsService.name.inputValidationError;
      throw new Error(errorMessage);
    }
    const token = await stripe.tokens.create({
      card: {
        number: request.number,
        exp_month: request.exp_month,
        exp_year: request.exp_year,
        cvc: request.cvc,
        name: request.name
      },
    });

    const cardResponse = await stripe.customers.createSource(
      user.stripe_customer,
      { source: token.id }
    );
    await stripe.customers.update(
      user.stripe_customer,
      { default_source: cardResponse.id }
    );
    log.info('Stripe createCard success');
    return 'New card added successfully';
  },

  getByUser: async (user) => {

    if (!user.stripe_customer) {
      return null
    }
    const customer = await stripe.customers.retrieve(
      user.stripe_customer
    );
    if (!customer) {
      return null
    }
    if (!customer.default_source) {
      return null
    }
    const card = await stripe.customers.retrieveSource(
      user.stripe_customer,
      customer.default_source
    );
    const { brand, exp_month, exp_year, funding, last4 } = card
    return {
      brand, exp_month, exp_year, funding, last4
    };
  },

  checkCardExist: async (stripeCustomerId) => {

    try {
      const customer = await stripe.customers.retrieve(
        stripeCustomerId
      );
      if (!customer) {
        return false;
      }
      if (!customer.default_source) {
        return false;
      }
      const card = await stripe.customers.retrieveSource(
        stripeCustomerId,
        customer.default_source
      );
      const { brand, exp_month, exp_year, funding, last4 } = card;
      log.info('Stripe checkCardExist success');
      return {
        brand, exp_month, exp_year, funding, last4
      };
    } catch (error) {
      log.error('Stripe checkCardExist', error);
      return false;
    }
  },

  chargeFromUser: async (stripeCustomerId, amount, description) => {

    try {
      amount = Number((amount * 100).toFixed(2)); //CAD is a Zero-decimal currency (https://stripe.com/docs/currencies#zero-decimal)
      const charge = await stripe.charges.create({
        amount: amount,
        currency: config.APP_CURRENCY,
        customer: stripeCustomerId,
        description,
      });
      log.info('Stripe chargeFromUser success');
      return { success: true, charge };
    } catch (error) {
      log.error('Stripe chargeFromUser', error);
      return { success: false, error: error.message };
    }
  },

  tempChargeFromUser: async (stripeCustomerId, amount, description) => {

    try {
      amount = Number((amount * 100).toFixed(2)); //CAD is a Zero-decimal currency (https://stripe.com/docs/currencies#zero-decimal)
      const charge = await stripe.charges.create({
        amount: amount,
        currency: config.APP_CURRENCY,
        customer: stripeCustomerId,
        description,
        capture: false
      });
      //sample res : { success: true, charge: {} }
      log.info('Stripe tempChargeFromUser success');
      return { success: true, charge };
    } catch (error) {
      //sample res : { success: false, error: 'Your card was declined.' }
      log.error('Stripe tempChargeFromUser', error);
      return { success: false, error: error.message };
    }
  },

  captureACharge: async (chargeId) => {

    try {
      const capture = await stripe.charges.capture(chargeId);
      log.info('Stripe captureACharge success');
      return { success: true, capture };
    } catch (error) {
      log.error('Stripe captureACharge', error);
      return { success: false, error: error.message };
    }
  },

  refundACharge: async (chargeId) => {

    try {
      const refund = await stripe.refunds.create({
        charge: chargeId
      });
      log.info('Stripe refundACharge success');
      return { success: true, refund };
    } catch (error) {
      log.error('Stripe refundACharge', error);
      return { success: false, error: error.message };
    }
  },

};

module.exports = StripeService;

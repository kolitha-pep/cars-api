const config = require('config');
const baseJoi = require('joi');
const extension = require('joi-date-extensions');
const mongoose = require('mongoose');
const moment = require('moment');
const _ = require('lodash');

const Joi = baseJoi.extend(extension);
const ConstantsService = require('./ConstantsService');
const StripeService = require('./StripeService');
const Mailer = require('./EmailService');
const CarsModel = require('../models/CarsModel');
const UserModel = require('../models/UserModel');
const { newCarValidateSchema } = require('../schemas/CarSchema');

const CarService = {
  postCar: async (user, data) => {
    const validation = Joi.validate(data, newCarValidateSchema);
    if (validation.error) {
      let errorMessage = validation.error.details.shift();
      errorMessage = errorMessage.message || ConstantsService.name.inputValidationError;
      throw new Error(errorMessage);
    }

    // const getUser = await UserModel.findOne(
    //   { _id: mongoose.Types.ObjectId(user._id) },
    //   { stripe_customer: 1 }
    // );
    // if (!getUser.stripe_customer) {
    //   throw new Error('You can not add car details at the moment. Please contact admin.');
    // }

    // const cardExist = await StripeService.checkCardExist(getUser.stripe_customer);
    // if (!cardExist) {
    //   throw new Error('You need to add a payment method before adding car details.');
    // }

    // const holdAmount = CarService.getAmount(data.billing_type);
    // let chargeId = null;
    // if (holdAmount > 0) {
    //   const charge = await StripeService.tempChargeFromUser(
    //     getUser.stripe_customer,
    //     holdAmount,
    //     `sell car charge from user id - ${user._id}`
    //   );
    //   chargeId = charge.charge.id;
    //   if (!charge.success) {
    //     throw new Error(charge.error);
    //   }
    // }
    const sellCar = {
      ...data,
      ...{ user: mongoose.Types.ObjectId(user._id), charge_id: null },
    };
    await CarsModel.create(sellCar);
    await CarService.sendSuccessSellCarEmail(user, null);
    return 'Car details successfully recorded.';
  },

  getCars: async (request) => {
    let { limit, offset, search } = request;
    limit = parseInt(limit, 10) || 20;
    let searchQuery = {};

    if (search && search !== '') {
      search = search.trim().toLowerCase();
      const queryString = new RegExp(
        search
          .trim()
          .toLowerCase()
          .replace(/([.*+?=^!:${}()|[\]\/\\])/g, '\\$1'),
        'i'
      );
      searchQuery = {
        $or: [
          { seller_name: { $regex: queryString } },
          { make: { $regex: queryString } },
          { model: { $regex: queryString } },
          { location: { $regex: queryString } },
        ],
      };
    }

    offset = parseInt(offset, 10) || 0;
    const total = await CarsModel.count(searchQuery);
    const cars = await CarsModel.find(searchQuery)
      .skip(offset)
      .limit(limit)
      .sort({ createdAt: 'desc' });

    return { cars, filters: { total, limit, offset, search } };
  },

  getById: async (car_id) => {
    const car = await CarsModel.findOne({ _id: car_id }).lean();
    const user = await UserModel.findOne({ _id: car.user })
    car.user_email = user.email;
    car.user_name = user.user_name;
    return car;
  },

  approve: async (car_id) => {
    const car = await CarsModel.findOne({ _id: car_id });
    const user = await UserModel.findOne({ _id: car.user });
    if (!car || (moment(car.createdAt).add(7, 'day') < moment())) {
      throw new Error('This request only can reject since more than 7 days exceed from create date');
    }
    // const heldAmount = CarService.getAmount(car.billing_type);
    // if (car.charge_id) {
    //   await StripeService.captureACharge(car.charge_id);
    // }
    await CarService.sendApprovedSellCarEmail(user, car, null);
    await CarsModel.updateOne({ _id: car_id }, { $set: { status: 'approved' } });
    return 'Sell car request approved';
  },

  reject: async (car_id) => {
    const car = await CarsModel.findOne({ _id: car_id });
    const user = await UserModel.findOne({ _id: car.user });
    // const heldAmount = CarService.getAmount(car.billing_type);
    // if (car.charge_id) {
    //   await StripeService.refundACharge(car.charge_id);
    // }
    await CarsModel.updateOne({ _id: car_id }, { $set: { status: 'rejected' } });
    await CarService.sendRejectedSellCarEmail(user, car, null);

    return 'Sell car request rejected.';
  },

  deleteCar: async (id) => {
    const deleteCarResponse = await CarsModel.deleteOne({ _id: mongoose.Types.ObjectId(id) });
    return deleteCarResponse;
  },

  sendSuccessSellCarEmail: async (user, holdAmount) => {
    try {
      Mailer.send(
        user.email,
        `Thank You for Submitting Your Car`,
        'emails/new-sell-car.pug',
        {
          holdAmount,
          title: `Congratulations...!!! Your car is in onemorecar.ca!`,
          name: user.user_name,
        }
      );
      return true;
    } catch (error) {
      throw new Error('CarService sendSuccessSellCarEmail error');
    }
  },

  sendApprovedSellCarEmail: async (user, car, amount) => {
    try {
      Mailer.send(
        user.email,
        `Your car has been accepted to be featured in onemorecar.ca!`,
        'emails/approve-sell-car.pug',
        {
          amount,
          title: `Your car has been accepted to be featured in onemorecar.ca!`,
          name: car.seller_name,
        }
      );
      return true;
    } catch (error) {
      throw new Error('CarService sendRejectedSellCarEmail error', error);
    }
  },

  sendRejectedSellCarEmail: async (user, car, amount) => {
    try {
      Mailer.send(
        user.email,
        `Sorry, we are unable to feature your car on onemorecar.ca`,
        'emails/reject-sell-car.pug',
        {
          amount,
          title: `Sorry, we are unable to feature your car on onemorecar.ca`,
          name: car.seller_name,
        }
      );
      return true;
    } catch (error) {
      throw new Error('CarService sendRejectedSellCarEmail error', error);
    }
  },

  getAmount: (billingType) => {
    if (billingType == 'turn_key') {
      return 0;
    } else if (billingType == 'reserve') {
      return config.SELL_CAR_CHARGE.RESERVE;
    } else {
      return config.SELL_CAR_CHARGE.NO_RESERVE;
    }
  },
};

module.exports = CarService;

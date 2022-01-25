const baseJoi = require('joi');
const extension = require('joi-date-extensions');
const config = require('config');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const mongoose = require('mongoose');
const Mailer = require('../../services/EmailService');
const UserModel = require('../../models/UserModel');
const responseService = require('../../services/ResponseService');
const AuctionService = require('../../services/AuctionService');
const StripeService = require('../../services/StripeService');
const log = require('simple-node-logger').createSimpleLogger();
const {
  loginValidateSchema, signUpValidateSchema, resetPasswordValidateSchema, forgotPasswordValidateSchema
} = require('../../schemas/UserSchema');
const stripe = require('stripe')(config.STRIPE_KEY);

const Joi = baseJoi.extend(extension);

const isAuthenticated = async (request, response, user) => {
  const authenticated = await bcrypt.compare(request.body.password, user.password);
  if (!authenticated) {
    responseService.response(response, config.RESPONSE.CODE.ERROR, 'Invalid password');
    return false;
  }
  return true;
};

const UserController = {

  login: async (request, response) => {
    try {
      let validation = Joi.validate(request.body, loginValidateSchema);

      if (validation && validation.error) {
        const errorMessage = validation.error.details[0] ? (validation.error.details[0].message || 'not found') : 'not found';
        responseService.response(response, config.RESPONSE.CODE.ERROR, errorMessage);
      } else {
        try {
          const query = {
            status: { $in: ['active'] },
            email: request.body.email,
            role: {
              $in: ['admin', 'user'],
            }
          };
          const user = await UserModel.findOne(query);
          if (!user) {
            responseService.response(response, config.RESPONSE.CODE.ERROR, 'user not found');
          } else {
            const authenticated = await isAuthenticated(request, response, user);
            if (authenticated) {
              const tokenData = {
                id: user.id,
                role: user.role,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email
              };
              const token =  jwt.sign(tokenData, config.JWT_SECRET, { expiresIn: '1 days'});
              const responseUser = user.toObject();
              delete responseUser.password;
              delete responseUser.password_reset_token;
              delete responseUser.password_reset_request_time;
              delete responseUser.tokens;
              const result = { user: responseUser, token };
              user.tokens = [].concat({ token })
              await user.save();
              responseService.response(response, config.RESPONSE.CODE.SUCCESS, result);
            }
          }
        } catch (error) {
          log.error('UserController login error ', error);
          responseService.response(response, config.RESPONSE.CODE.ERROR, error.message);
        }
      }
    } catch (error) {
      log.error('UserController login error ', error);
      responseService.error(response, error);
    }
  },

  logout: async (request, response) => {
    const user = await UserModel.findOne({_id : request.body.user_id});
    user.tokens = user.tokens.filter((token) =>{
      return token.token !== request.token
    });
    await user.save();
    responseService.response(response, config.RESPONSE.CODE.SUCCESS, 'User removed');
  },

  signUp: async (request, response) => {
    try {
      let validation = Joi.validate(request.body, signUpValidateSchema);
      if (validation && validation.error) {
        const errorMessage = validation.error.details[0] ? (validation.error.details[0].message || 'not found') : 'not found';
        responseService.response(response, config.RESPONSE.CODE.ERROR, errorMessage);
      } else {
        try {
          const existUser = await UserModel.findOne({ email: request.body.email });
          if (existUser) {
            responseService.response(response, config.RESPONSE.CODE.ERROR, 'email already exist');
          } else {
            const customer = await stripe.customers.create({
              email: request.body.email
            });
            const user = await UserModel({
              role: 'user',
              email: request.body.email,
              user_name: request.body.user_name,
              password: await bcrypt.hash(request.body.password, 2),
              stripe_customer: customer.id
            });
            let result = await user.save();
            result = result.toObject();
            delete result.password;
            delete result.password_reset_token;
            delete result.password_reset_request_time;
            delete result.tokens;
            await Mailer.send(request.body.email, 'Welcome to onemorecar.ca', 'emails/sign-up.pug', { name: request.body.user_name, url: `${config.WEB_URL}` });
            responseService.response(response, config.RESPONSE.CODE.SUCCESS, result);
          }
        } catch (error) {
          log.error('UserController signUp error ', error);
          responseService.response(response, config.RESPONSE.CODE.ERROR, error.message);
        }
      }
    } catch (error) {
      log.error('UserController signUp error ', error);
      responseService.error(response, error);
    }
  },

  generatePassword: async () => {
    const length = 12, charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
    let newString = '';
    for (let i = 0, n = charset.length; i < length; ++i) {
      newString += charset.charAt(Math.floor(Math.random() * n));
    }
    return newString;
  },

  forgotPassword: async (request, response) => {
    try {
      let validation = Joi.validate(request.body, forgotPasswordValidateSchema);
      if (validation && validation.error) {
        const errorMessage = validation.error.details[0] ? (validation.error.details[0].message || 'not found') : 'not found';
        responseService.response(response, config.RESPONSE.CODE.ERROR, errorMessage);
      } else {
        const query = {
          status: { $in: ['active'] },
          email: request.body.email,
          role: {
            $in: ['admin', 'user'],
          }
        };
        const user = await UserModel.findOne(query);
        if (!user) {
          responseService.response(response, config.RESPONSE.CODE.ERROR, 'Incorrect email address');
        } else {
          const newPassword = await UserController.generatePassword();
          const hashedPassword = await bcrypt.hash(newPassword, 2);
          await UserModel.findOneAndUpdate(
            { _id: user._id },
            { $set: { password: hashedPassword } }
          );
          await Mailer.send(
            request.body.email,
            'Password Reset Requested',
            'emails/forgot-password.pug',
            { name: user.user_name, password: newPassword, url: `${config.WEB_URL}` },
          );
          responseService.response(response, config.RESPONSE.CODE.SUCCESS, 'Send password details successfully');
        }
      }
    } catch (error) {
      log.error('UserController login error ', error);
      responseService.error(response, error);
    }
  },

  resetPassword: async (request, response) => {
    try {
      let validation = Joi.validate(request.body, resetPasswordValidateSchema);
      if (validation && validation.error) {
        const errorMessage = validation.error.details[0] ? (validation.error.details[0].message || 'not found') : 'not found';
        responseService.response(response, config.RESPONSE.CODE.ERROR, errorMessage);
      } else {
        const user = await UserModel.findOne({ _id: request.user._id });
        const passwordMatch = await bcrypt.compare(request.body.current_password, user.password);
        if (!passwordMatch) {
          throw new Error('Current password is incorrect');
        }
        const newPassword = await bcrypt.hash(request.body.new_password, 2);
        await UserModel.findOneAndUpdate(
          { _id: request.user._id },
          { $set: { password: newPassword } }
        );
        responseService.response(response, config.RESPONSE.CODE.SUCCESS, 'Password reset successfully');
      }
    } catch (error) {
      log.error('UserController resetPassword error ', error);
      responseService.error(response, error);
    }
  },

  getProfile: async (req, res) => {
    try {
      const { id } = req.params;
      let user = await UserModel.findOne({ _id: id }).select('user_name contact_no avatar email createdAt').lean();
      user.auctions = await AuctionService.getAuctionsToProfile(id);
      responseService.response(res, config.RESPONSE.CODE.SUCCESS, user);
    } catch (error) {
      log.error('UserController getProfile error ', error);
      responseService.response(res, config.RESPONSE.CODE.ERROR, error);
    }
  },

  getOwnProfile: async (req, res) => {
    try {
      const { _id } = req.user;
      let user = await UserModel.findOne({ _id }).select('user_name contact_no avatar email').lean();
      user.card = await StripeService.getByUser(req.user);
      responseService.response(res, config.RESPONSE.CODE.SUCCESS, user);
    } catch (error) {
      log.error('UserController getProfile error ', error);
      responseService.response(res, config.RESPONSE.CODE.ERROR, error);
    }
  },

  updateProfile: async (req, res) => {
    try {
      const updateProfileSchema = Joi.object().keys({
        user_name: Joi.string(),
        contact_no: Joi.string().allow([null, '']),
        avatar: Joi.string().allow([null, ''])
      });
      let validation = Joi.validate(req.body, updateProfileSchema);
      if (validation && validation.error) {
        const errorMessage = validation.error.details[0] ? (validation.error.details[0].message || 'not found') : 'not found';
        responseService.response(res, config.RESPONSE.CODE.ERROR, errorMessage);
      } else {
        const updateData = {};
        if (req.body.user_name) {
          updateData.user_name = req.body.user_name;
        }
        if (req.body.contact_no) {
          updateData.contact_no = req.body.contact_no;
        }
        if (req.body.avatar) {
          updateData.avatar = req.body.avatar;
        }
        await UserModel.findOneAndUpdate(
          { _id: req.user._id },
          { $set: updateData }
        );
        responseService.response(res, config.RESPONSE.CODE.SUCCESS, 'Profile updated successfully');
      }
    } catch (error) {
      log.error('UserController updateProfile error ', error);
      responseService.response(res, config.RESPONSE.CODE.ERROR, error);
    }
  },

  getUserList: async (req, res) => {
    try {
      let sort = {};
      if (req.query.sort) {
        sort[req.query.sort] =  -1;
      } else {
        sort = { email: 1 };
      }
      const users = await UserModel.find({ role: 'user', status: 'active' })
        .select('_id email user_name first_name last_name createdAt')
        .sort(sort);
      responseService.success(res, users);
    } catch (error) {
      log.error('UserController getUserList error ', error);
      responseService.error(res, error.message);
    }
  }
};

module.exports = UserController;

const baseJoi = require('joi');
const extension = require('joi-date-extensions');
const config = require('config');
const UserModel = require('../../models/UserModel');
const responseService = require('../../services/ResponseService');
const AuctionService = require('../../services/AuctionService');
const log = require('simple-node-logger').createSimpleLogger();
const _ = require('lodash');
const Joi = baseJoi.extend(extension);

const WishListController = {

  create: async (request, response) => {
    try {
      const newWishListSchema = Joi.object().keys({
        auction_id: Joi.string().required()
      });
      let validation = Joi.validate(request.body, newWishListSchema);
      if (validation && validation.error) {
        const errorMessage = validation.error.details[0] ? (validation.error.details[0].message || 'not found') : 'not found';
        responseService.response(response, config.RESPONSE.CODE.ERROR, errorMessage);
      } else {
        const user = await UserModel.findOne({ _id: request.user._id });
        const userWishList = user.wish_list;
        userWishList.push(request.body.auction_id);
        await UserModel.findOneAndUpdate(
          { _id: request.user._id },
          { $set: { wish_list: _.uniq(userWishList)} }
        );
      }
      responseService.success(response, 'Auction id added successfully to wish-list');
    } catch (error) {
      log.error('WishListController create error ', error);
      responseService.error(response, error);
    }
  },

  getWishList: async (req, res) => {
    try {
      const user = await UserModel.findOne({ _id: req.user._id });
      const userWishList = user.wish_list;
      const request = req.query;
      request.wish_list = userWishList || [];
      const result = await AuctionService.getAuctionsToHome(request);
      responseService.success(res, result);
    } catch (error) {
      log.error('WishListController getWishListIds error ', error);
      responseService.error(res, error.message);
    }
  },

  getWishListIds: async (req, res) => {
    try {
      const user = await UserModel.findOne({ _id: req.user._id });
      const userWishList = user.wish_list;
      responseService.success(res, { wish_list_auction_ids: userWishList});
    } catch (error) {
      log.error('WishListController getWishListIds error ', error);
      responseService.error(res, error.message);
    }
  },

  remove: async (request, response) => {
    try {
      const auctionId = request.params.auction_id || null;
      const user = await UserModel.findOne({ _id: request.user._id });
      let userWishList = user.wish_list;
      userWishList = userWishList.filter(e => e !== auctionId);
      await UserModel.findOneAndUpdate(
        { _id: request.user.id },
        { $set: { wish_list: userWishList} }
      );
      responseService.success(response, 'Auction id remove successfully from wish-list');
    } catch (error) {
      log.error('WishListController remove error ', error);
      responseService.error(response, error);
    }
  },
};

module.exports = WishListController;

const baseJoi = require('joi');
const extension = require('joi-date-extensions');
const config = require('config');
const moment = require('moment');
const CommentModel = require('../../models/CommentModel');
const AuctionModel = require('../../models/AuctionModel');
const ResponseService = require('../../services/ResponseService');
const BidService = require('../../services/BidService');
const { newCommentValidateSchema } = require('../../schemas/CommentSchema');
const log = require('simple-node-logger').createSimpleLogger();
const Joi = baseJoi.extend(extension);

const BidController = {

  addBid: async (request, response) => {
    try {
      const result = await BidService.addBid(request.body, request.user);
      ResponseService.success(response, result);
    } catch (error) {
      log.error('BidController addBid error ', error);
      ResponseService.error(response, error);
    }
  },
};

module.exports = BidController;

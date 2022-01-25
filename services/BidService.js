const config = require('config');
const baseJoi = require('joi');
const extension = require('joi-date-extensions');
const mongoose = require('mongoose');
const moment = require('moment');
const _ = require('lodash');

const Joi = baseJoi.extend(extension);
const ConstantsService = require('./ConstantsService');
const StripeService = require('./StripeService');
const AuctionModel = require('../models/AuctionModel');
const CommentModel = require('../models/CommentModel');
const BidModel = require('../models/BidModel');
const UserModel = require('../models/UserModel');
const Mailer = require('./EmailService');
const log = require('simple-node-logger').createSimpleLogger();

const BidService = {

  addBid: async (body, user) => {
    const newBidValidateSchema = Joi.object().keys({
      auction_id: Joi.string().required(),
      amount: Joi.number().required()
    });
    let validation = Joi.validate(body, newBidValidateSchema);
    if (validation && validation.error) {
      const errorMessage = validation.error.details[0] ? (validation.error.details[0].message || 'not found') : 'not found';
      throw new Error(errorMessage);
    } else {
      const auctionId = body.auction_id;
      const amount = Number(body.amount);
      const holdAmount = Number(((amount * config.HOLD_BID_PERCENTAGE) / 100).toFixed(2));

      const auction = await AuctionModel.findOne({ _id: auctionId, status: 'active', adz_type: 'auction' });
      if (!auction || (moment(auction.auction_end_time) < moment())) {
        throw new Error('Cannot bid for this auction at the moment');
      }

      const currentBid = (auction.current_bid_amount) ? auction.current_bid_amount : 0;
      if (currentBid + config.MINIMUM_BID_INCREASE > amount) {
        throw new Error(`Minimum bid increment is $${currentBid + config.MINIMUM_BID_INCREASE}`);
      }

      if (!user.stripe_customer) {
        throw new Error('You cannot bid for any auction at the moment. Please contact admin');
      }
      const cardExist = await StripeService.checkCardExist(user.stripe_customer);
      if (!cardExist) {
        throw new Error('You need to add a payment method before bidding');
      }

      const charge = await StripeService.tempChargeFromUser(
        user.stripe_customer,
        holdAmount,
        `A new bid for auction id - ${auctionId} user id - ${user._id}`
      );
      if (!charge.success) {
        throw new Error(charge.error);
      }

      const biddingData = {
        amount,
        hold_amount: holdAmount,
        auction_id: auctionId,
        user: user._id,
        stripe_charge_id: charge.charge.id
      };

      const previousBid = await BidModel.findOne({auction_id: auctionId, status: 'active'});
      if (previousBid) {
        await StripeService.refundACharge(previousBid.stripe_charge_id);
        await BidModel.findOneAndUpdate(
          { _id: previousBid._id },
          { $set: { status: 'inactive', highest_bid: false } }
        );
      }
      const bidResponse = await BidModel.create(biddingData);
      const commentData = {
        comment: `I have placed a bid of $${amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`,
        auction_id: auctionId,
        user: user._id,
        reply: false,
        type: 'bid'
      };
      await CommentModel.create(commentData);
      const bidCount = await BidModel.countDocuments({ auction_id: auctionId });

      let endTime = moment(auction.auction_end_time);
      const duration = moment(auction.auction_end_time).diff(moment(), 'minutes');
      if (duration <=10) {
        endTime = moment(auction.auction_end_time).add(config.AUCTION_EXTEND_MINUTES, 'minute');
      }
      
      await AuctionModel.findOneAndUpdate(
        { _id: auctionId },
        { $set: { current_bid_amount: amount, current_bid_id: bidResponse._id, total_bids: bidCount, auction_end_time: endTime } }
      );
      await BidService.sendSuccessBidEmail(bidResponse, user, auction, holdAmount);
      if (previousBid) {
        await BidService.sendPreviousBidRefundEmail(previousBid, amount, auction);
      }
      return `A new bid of ${amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')} has added successfully`;
    }
  },

  sendSuccessBidEmail: async (bid, user, auction, holdAmount) => {

    try {
      const content = {
        bid: bid.amount,
        holdAmount,
        holdPercentage: config.HOLD_BID_PERCENTAGE,
        title: auction.title,
        name: user.user_name,
        url: `${config.WEB_URL}/auctions/${auction.slug}` 
      };
      Mailer.send(
        user.email,
        `Bid confirmation for ${auction.title}`,
        'emails/new-bid.pug',
        content
      );
      Mailer.send(
        'support@onemorecar.ca',
        `Bid confirmation for ${auction.title} - Admin copy`,
        'emails/new-bid.pug',
        content
      );
      return true;
    } catch (error) {
      log.error('BidService sendSuccessBidEmail error ', error);
      return false;
    }

  },

  sendPreviousBidRefundEmail: async (previousBid, amount, auction) => {

    try {
      const user = await UserModel.findOne({ _id: previousBid.user });
      Mailer.send(
        user.email,
        `You’ve been outbid on the ${auction.title}`,
        'emails/out-bid.pug',
        { 
          bid: amount,
          holdAmount: previousBid.hold_amount,
          title: auction.title,
          name: user.user_name,
          url: `${config.WEB_URL}/auctions/${auction.slug}` });
      return true;
    } catch (error) {
      log.error('BidService sendPreviousBidRefundEmail error ', error);
      return false;
    }
  },

  sendRejectedAuctionEmail: async (bid, auction) => {

    try {
      const user = await UserModel.findOne({ _id: bid.user });
      Mailer.send(
        user.email,
        `The Auction you have been bidding on has been cancelled`,
        'emails/reject-auction.pug',
        { 
          holdAmount: bid.hold_amount,
          title: auction.title,
          name: user.user_name,
          url: `${config.WEB_URL}/auctions/${auction.slug}` });
      return true;
    } catch (error) {
      log.error('BidService sendRejectedAuctionEmail error ', error);
      return false;
    }
  }
};

module.exports = BidService;

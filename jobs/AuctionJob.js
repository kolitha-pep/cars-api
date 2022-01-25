const config = require('config');
const moment = require('moment');
const _ = require('lodash');

const AuctionModel = require('../models/AuctionModel');
const BidModel = require('../models/BidModel');
const UserModel = require('../models/UserModel');
const Mailer = require('../services/EmailService');
const StripeService = require('../services/StripeService');
const log = require('simple-node-logger').createSimpleLogger();

const AuctionJob = {

  /**
   * Update completed jobs and transfer amounts
   */
  endingAuction: async () => {

    try {
      const auctions = await AuctionModel.find({ adz_type : 'auction', status: 'active', auction_end_time: { $lte: moment().toDate() } }).lean();
      let processedAuctions = auctions.map(async auction => {
        log.info('Auction processing job: Started new auction id processing', auction._id);
        const auctionId = auction._id;
        const currentBid = await BidModel.findOne({ auction_id: auctionId, status: 'active' });
        if (!currentBid) {
          await AuctionModel.findOneAndUpdate(
            { _id: auctionId },
            { $set: { status: 'finished' } }
          );
        } else if (auction.reserve && auction.reserve_price && Number(auction.reserve_price) > currentBid.amount) {
          await StripeService.refundACharge(currentBid.stripe_charge_id);
          await BidModel.findOneAndUpdate(
            { _id: auctionId },
            { $set: { status: 'inactive' } }
          );
          await AuctionModel.findOneAndUpdate(
            { _id: auctionId },
            { $set: { status: 'reserve_not_met' } }
          );
          const user = await UserModel.findOne({ _id: currentBid.user });
          AuctionJob.sendReserveNotMetAuctionEmail(currentBid, user, auction);
        } else {

          await StripeService.captureACharge(currentBid.stripe_charge_id);
          await AuctionModel.findOneAndUpdate(
            { _id: auctionId },
            { $set: { status: 'finished' } }
          );
          const user = await UserModel.findOne({ _id: currentBid.user });
          const auctionOwner = await UserModel.findOne({ _id: auction.user });
          AuctionJob.sendSuccessBidEmail(currentBid, user, auction);
          AuctionJob.sendSoldEmailToOwner(currentBid, auctionOwner, auction);
        }
        log.info('Auction processing job: End auction id processing', auction._id);
        return true;
      });
      await Promise.all(processedAuctions);
      log.info('Auction processing job: All completed auctions processed');
      return true;
    } catch (error) {
      log.error('ActionJob endingAuction error ', error);
      return false;
    }
    
  },

  sendSuccessBidEmail: async (currentBid, user, auction) => {

    try {
      Mailer.send(
        user.email,
        `Congratulations! You’ve just added onemorecar to your garage!`,
        'emails/won-auction.pug',
        {
          bid: currentBid.amount,
          holdAmount: currentBid.hold_amount,
          name: user.user_name,
          auction_name: auction.title,
          url: `${config.WEB_URL}/auctions/${auction.slug}` });
      return true;
    } catch (error) {
      log.error('ActionJob sendSuccessBidEmail error ', error);
      return false;
    }

  },

  sendSoldEmailToOwner: async (currentBid, user, auction) => {

    try {
      Mailer.send(
        user.email,
        `Congratulations, your auction has ended!`,
        'emails/auction-completed.pug',
        {
          bid: currentBid.amount,
          name: user.user_name,
          auction_name: auction.title,
          url: `${config.WEB_URL}/auctions/${auction.slug}` });
      return true;
    } catch (error) {
      log.error('ActionJob sendSoldEmailToOwner error ', error);
      return false;
    }

  },

  sendReserveNotMetAuctionEmail: async (currentBid, user, auction) => {

    try {
      Mailer.send(
        user.email,
        `${auction.title} auction ended without meeting reserve`,
        'emails/reserve-not-met.pug',
        {
          bid: currentBid.amount,
          holdAmount: currentBid.hold_amount,
          name: user.user_name,
          auction_name: auction.title,
          url: `${config.WEB_URL}/auctions/${auction.slug}` });
      return true;
    } catch (error) {
      log.error('ActionJob sendReserveNotMetAuctionEmail error ', error);
      return false;
    }
  }
};

module.exports = AuctionJob;

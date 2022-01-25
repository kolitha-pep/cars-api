const config = require('config');
const moment = require('moment');
const _ = require('lodash');

const AuctionModel = require('../models/AuctionModel');
const UserModel = require('../models/UserModel');
const Mailer = require('../services/EmailService');
const log = require('simple-node-logger').createSimpleLogger();

const WishlistJob = {

  /**
   * Sending notification emails to wishlist users
   */
  sendNotifications: async () => {

    try {
      const auctions = await AuctionModel.find({ 
        adz_type : 'auction',
        status: 'active',
        auction_end_time: { $lte: moment().add(1, 'days').toDate(), $gt: moment().toDate() } }).lean();
      auctions.map(async auction => {

        const users = await UserModel.aggregate([
          { $match: { status: 'active' } },
          {
            $unwind:
              {
                path: "$wish_list",
                preserveNullAndEmptyArrays: true
              }
          },
          { $match: { wish_list: auction._id.toString() } }
        ]).exec();
        users.map(async user => {
          await WishlistJob.notificationEmail(user, auction);
        });
      });
      log.info('Auction notification job: Sent all the emails');
      return true;
    } catch (error) {
      log.error('WishlistJob sendNotifications error ', error);
      return false;
    }
    
  },

  notificationEmail: async (user, auction) => {

    try {
      Mailer.send(
        user.email,
        `${auction.title} auction is reached to it's end time`,
        'emails/wishlist-notification.pug',
        {
          name: user.user_name,
          auction_name: auction.title,
          url: `${config.WEB_URL}/auctions/${auction.slug}` });
      return true;
    } catch (error) {
      log.error('WishlistJob notificationEmail error ', error);
      return false;
    }

  }
};

module.exports = WishlistJob;

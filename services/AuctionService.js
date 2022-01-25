const config = require('config');
const baseJoi = require('joi');
const extension = require('joi-date-extensions');
const mongoose = require('mongoose');
const moment = require('moment');
const _ = require('lodash');

const Joi = baseJoi.extend(extension);
const ConstantsService = require('./ConstantsService');
const CommentService = require('./CommentService');
const BidService = require('./BidService'); 
const StripeService = require('./StripeService'); 
const AuctionModel = require('../models/AuctionModel');
const BidModel = require('../models/BidModel');
const UserModel = require('../models/UserModel');
const Mailer = require('./EmailService');
const { newAuctionValidateSchema, updateAuctionValidateSchema } = require('../schemas/AuctionSchema');

const AuctionService = {

  getList: async (request) => {
    const { sort  } = request;
    let {
      limit, offset, search,
    } = request;
    limit = parseInt(limit, 10) || 20;
    offset = parseInt(offset, 10) || 0;

    const searchQuery = { status: { $ne: 'deleted' } };
    if (search && search !== '') {
      search = search.trim().toLowerCase();
      const queryString = new RegExp(search.trim()
        .toLowerCase()
        .replace(/([.*+?=^!:${}()|[\]\/\\])/g, '\\$1'), 'i');
      searchQuery.title = { $regex: queryString };
    }
    let sortQuery = sort && sort.field && { [sort.field]: sort.order };
    sortQuery = sortQuery || { auction_end_time: -1 };
    const total = await AuctionModel.count(searchQuery);
    let auctions = await AuctionModel.aggregate([
      { $match: searchQuery },
      {
        $lookup:
          {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "seller"
          }
      },
      {
        $unwind:
          {
            path: "$seller",
            preserveNullAndEmptyArrays: true
          }
      },
      {
        $project: {
          _id: '$_id',
          title: '$title',
          slug: '$slug',
          seller_id: '$user',
          seller_email: '$seller.email',
          seller_user_name: '$seller.user_name',
          location: '$location',
          auction_end_time: '$auction_end_time',
          current_bid_amount: '$current_bid_amount',
          total_bids: '$total_bids',
          featured: '$featured',
          adz_type: '$adz_type',
          status: '$status',
          end_reason: '$end_reason',
          createdAt: '$createdAt',
        },
      },
      {
        $sort: sortQuery,
      },
      {
        $skip: offset,
      },
      {
        $limit: limit,
      }
    ]).exec();
    return { auctions, filters: { total, limit, offset, search }};
  },

  save: async (request) => {
    const validation = Joi.validate(request, newAuctionValidateSchema);
    if (validation.error) {
      let errorMessage = validation.error.details.shift();
      errorMessage = errorMessage.message || ConstantsService.name.inputValidationError;
      throw new Error(errorMessage);
    }

    let auctionStartTime =  null;
    let auctionEndTime = null;
    const user = await UserModel.findOne({ _id: mongoose.Types.ObjectId(request.user) });
    if (request.adz_type !== 'found_in_market') {
      if (!user) {
        throw new Error('User not found');
      }
      auctionStartTime =  moment();
      auctionEndTime = moment().add(config.AUCTION_DURATION_DAYS, 'day');
    }
    const slug = await AuctionService.generateSlug(request.title);
    const auction = {
      title: request.title,
      sub_title: request.sub_title || null,
      user: request.user,
      reserve: (request.reserve) ? true : false,
      year_of_made: request.year_of_made,
      make: request.make,
      model: request.model,
      vin: request.vin,
      mileage: request.mileage,
      reserve_price: request.reserve_price || 0,
      location: request.location,
      body_style: request.body_style,
      engine_capacity: request.engine_capacity,
      drivetrain: request.drivetrain,
      transmission: request.transmission,
      exterior_color: request.exterior_color,
      interior_color: request.interior_color,
      title_status: request.title_status,
      seller_type: request.seller_type,
      vehicle_history_report_link: request.vehicle_history_report_link,
      feature_image: request.feature_image,
      gallery_images: request.gallery_images || [],
      videos: request.videos || [],
      sub_sections: request.sub_sections || [],
      adz_type: request.adz_type,
      featured: (request.featured) ? true : false,
      auction_start_time: auctionStartTime,
      auction_end_time: auctionEndTime,
      greater_toronto_area: (request.greater_toronto_area) ? true : false,
      status: 'active',
      slug
    };
    const auctionResponse = await AuctionModel.create(auction);
    if (request.adz_type !== 'found_in_market') {
      await Mailer.send(
        user.email,
        `Your ${request.title} Auction is now live!`,
        'emails/new-auction.pug',
        { name: user.user_name, title: request.title, url: `${config.WEB_URL}/auctions/${auctionResponse.slug}` });
    }
    return auctionResponse;
  },

  generateSlug: async (title) => {

    let slug = _.kebabCase(title);
    let slugExist = true;
    let counter = 0;
    while (slugExist) {
      let newSlug = (counter == 0) ? _.cloneDeep(slug) : `${_.cloneDeep(slug)}-${counter}`;
      const auction = await AuctionModel.findOne({ slug: newSlug }).lean();
      if (!auction) {
        slugExist = false;
        slug = newSlug;
      }
      counter++;
    }
    return slug;
  },

  update: async (request, auctionId) => {
    const currentAuction = await AuctionModel.findOne({ _id: auctionId });
    if (!currentAuction) {
      throw new Error('Cannot find an auction for this Id');
    }
    const validation = Joi.validate(request, updateAuctionValidateSchema);
    if (validation.error) {
      let errorMessage = validation.error.details.shift();
      errorMessage = errorMessage.message || ConstantsService.name.inputValidationError;
      throw new Error(errorMessage);
    }
    const auction = {
      year_of_made: request.year_of_made,
      sub_title: request.sub_title,
      make: request.make,
      model: request.model,
      vin: request.vin,
      mileage: request.mileage,
      reserve_price: request.reserve_price || 0,
      location: request.location,
      body_style: request.body_style,
      engine_capacity: request.engine_capacity,
      drivetrain: request.drivetrain,
      transmission: request.transmission,
      exterior_color: request.exterior_color,
      interior_color: request.interior_color,
      title_status: request.title_status,
      seller_type: request.seller_type,
      vehicle_history_report_link: request.vehicle_history_report_link,
      feature_image: request.feature_image,
      gallery_images: request.gallery_images || [],
      videos: request.videos || [],
      sub_sections: request.sub_sections || [],
      featured: (request.featured) ? true : false,
      greater_toronto_area: (request.greater_toronto_area) ? true : false,
      hide_user_email: (request.hide_user_email) ? true : false,
    };

    if (request.auction_end_time) {
      if (!moment(currentAuction.auction_end_time).isSame(moment(request.auction_end_time))) {
        const endDate = moment(request.auction_end_time);
        if (moment().isSameOrAfter(endDate)) {
          throw new Error('auction_end_time should be greater than now');
        }
        // if (endDate.isSameOrAfter(moment().add(config.AUCTION_DURATION_DAYS, 'day'))) {
        //   throw new Error('auction_end_time cannot be greater than 7 days from now');
        // }
        auction.auction_end_time = endDate;
      }
    }
    return AuctionModel.findOneAndUpdate(
      { _id: auctionId },
      { $set: auction },
      { new: true },
    );
  },

  remove: async (auctionId) => {
    const currentAuction = await AuctionModel.findOne({ _id: auctionId });
    if (!currentAuction) {
      throw new Error('Cannot find an auction for this Id');
    }
    const bidCount = await BidModel.countDocuments({ auction_id: auctionId });
    if (bidCount > 0) {
      throw new Error('This action already have bids');
    }
    const auction = {
      status: 'deleted',
    };
    await AuctionModel.findOneAndUpdate(
      { _id: auctionId },
      { $set: auction }
    );
    return 'Auction deleted successfully';
  },

  reject: async (auctionId) => {
    const currentAuction = await AuctionModel.findOne({ _id: auctionId, status: 'active'  });
    if (!currentAuction) {
      throw new Error('Cannot find an active auction for this Id');
    }
    const bidCount = await BidModel.countDocuments({ auction_id: auctionId });
    if (bidCount > 0) {

      const bid = await BidModel.findOne({auction_id: auctionId, status: 'active'});
      if (bid) {
        await StripeService.refundACharge(bid.stripe_charge_id);
        await BidModel.findOneAndUpdate(
          { _id: bid._id },
          { $set: { status: 'inactive', highest_bid: false } }
        );
      }
      await BidService.sendRejectedAuctionEmail(bid, currentAuction);
    }
    await AuctionModel.findOneAndUpdate(
      { _id: auctionId },
      { $set: { current_bid_id: null, status: 'rejected', auction_end_time: moment()  } }
    );
    return 'Auction rejected successfully';
  },

  getById: async (auctionId) => {
    const auction = await AuctionModel.findOne({ _id: auctionId }).lean();
    const bids = await BidModel.find({ auction_id: auctionId }).select('amount hold_amount status')
      .exec();
    auction.bids = bids
    return auction;
  },

  getAuctionsToHome: async (request) => {

    let {
      limit, offset, search, adz_type, auction_type, filter_type
    } = request;
    const { wish_list } = request;
    const requestInputs = {};
    limit = parseInt(limit, 10) || 8;
    offset = parseInt(offset, 10) || 0;
    
    const searchQuery = { status: { $nin: ['deleted'] } };
    if (search && search !== '') {
      search = search.trim().toLowerCase();
      const queryString = new RegExp(search.trim()
        .toLowerCase()
        .replace(/([.*+?=^!:${}()|[\]\/\\])/g, '\\$1'), 'i');
      searchQuery.title = { $regex: queryString };
    }

    if (wish_list) { // Get user wish list items
      const wishListIds = wish_list.map(item => mongoose.Types.ObjectId(item));
      searchQuery._id = { $in: wishListIds };
    }

    let sortQuery = { auction_end_time: -1 };
    adz_type = adz_type || 'auction';
    searchQuery.adz_type = adz_type;
    if (adz_type == 'auction') {

      auction_type = auction_type || 'live';
      if (auction_type == 'past') {
        searchQuery.auction_end_time = { $lte: moment().toDate() };
        sortQuery = { auction_end_time: -1 };
        filter_type = null;
      } else { // live auctions
        searchQuery.auction_end_time = { $gt: moment().toDate() };
        filter_type = filter_type || 'ending_soon';
        switch (filter_type) {
          case 'ending_soon':
            sortQuery = { featured: -1, auction_end_time: 1 };
            break;
          case 'newly_listed':
            sortQuery = { featured: -1, auction_end_time: -1 };
            break;
          case 'no_reserve':
            sortQuery = { featured: -1, auction_end_time: 1 };
            searchQuery.reserve = false;
            break;
          case 'greater_toronto_area':
              sortQuery = { featured: -1, auction_end_time: 1 };
              searchQuery.greater_toronto_area = true;
              break;
        }
      }
    } else {
      //for found_in_market no auction_type and filter_type
      filter_type = null;
      auction_type = null;
      sortQuery = { createdAt: -1 };
    }
    
    const total = await AuctionModel.countDocuments(searchQuery);
    let auctions = await AuctionModel.aggregate([
      { $match: searchQuery },
      {
        $lookup:
          {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "seller"
          }
      },
      {
        $unwind:
          {
            path: "$seller",
            preserveNullAndEmptyArrays: true
          }
      },
      {
        $project: {
          _id: '$_id',
          title: '$title',
          sub_title: '$sub_title',
          slug: '$slug',
          seller_id: '$user',
          seller_email: '$seller.email',
          seller_user_name: '$seller.user_name',
          location: '$location',
          greater_toronto_area: '$greater_toronto_area',
          auction_end_time: '$auction_end_time',
          current_bid_amount: '$current_bid_amount',
          total_bids: '$total_bids',
          featured: '$featured',
          adz_type: '$adz_type',
          status: '$status',
          reserve: '$reserve',
          createdAt: '$createdAt',
          feature_image: '$feature_image'
        },
      },
      {
        $sort: sortQuery,
      },
      {
        $skip: offset,
      },
      {
        $limit: limit,
      }
    ]).exec();
    requestInputs.auction_type = ['live', 'past'];
    requestInputs.filter_type = ['ending_soon', 'newly_listed', 'no_reserve', 'greater_toronto_area'];
    requestInputs.adz_type = ['auction', 'found_in_market'];
    return { 
      auctions,
      filters: { total, limit, offset, search, auction_type, adz_type, filter_type },
      filter_values: requestInputs
    };
  },

  getDetailsByIdForFrontend: async (auctionId) => {
    const auction = await AuctionModel.findOne({ _id: auctionId })
      .lean().exec();
    if (!auction) {
      throw new Error('Cannot find an auction for this Id');
    }
    const auctionAvoidAttributes = [
      'user', 'reserve_price', 'auction_start_time', 'current_bid_id', 'end_reason', 'updatedAt'
    ];
    const auctionData = _.cloneDeep(auction);
    auctionAvoidAttributes.forEach(attribute => {
      delete auctionData[attribute];
    });

    let seller = null;
    if (auction.user) {
      seller = await UserModel.findOne({ _id: auction.user }).select('_id first_name last_name user_name email avatar');
    }

    const comments = await CommentService.getComments(auctionId);
    const commentCount = await CommentService.getCommentsCount(auctionId);
    return { auction: auctionData, seller, comments, comment_count: commentCount };
  },

  getDetailsBySlugForFrontend: async (slug) => {
    const auction = await AuctionModel.findOne({ slug })
      .lean().exec();
    if (!auction) {
      throw new Error('Cannot find an auction for this slug');
    }
    const auctionId = auction._id;
    const auctionAvoidAttributes = [
      'user', 'reserve_price', 'auction_start_time', 'current_bid_id', 'end_reason', 'updatedAt'
    ];
    const auctionData = _.cloneDeep(auction);
    auctionAvoidAttributes.forEach(attribute => {
      delete auctionData[attribute];
    });

    let seller = null;
    if (auction.user) {
      seller = await UserModel.findOne({ _id: auction.user }).select('_id first_name last_name user_name email avatar');
    }

    const comments = await CommentService.getComments(auctionId);
    const commentCount = await CommentService.getCommentsCount(auctionId);
    return { auction: auctionData, seller, comments, comment_count: commentCount };
  },

  getAuctionsToProfile: async (userId) => {

    const searchQuery = { status: { $nin: ['deleted'] }, adz_type: 'auction', user: mongoose.Types.ObjectId(userId) };
    const sortQuery = { auction_end_time: -1 };
    let auctions = await AuctionModel.aggregate([
      { $match: searchQuery },
      {
        $lookup:
          {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "seller"
          }
      },
      {
        $unwind:
          {
            path: "$seller",
            preserveNullAndEmptyArrays: true
          }
      },
      {
        $project: {
          _id: '$_id',
          title: '$title',
          sub_title: '$sub_title',
          slug: '$slug',
          seller_id: '$user',
          seller_email: '$seller.email',
          seller_user_name: '$seller.user_name',
          location: '$location',
          greater_toronto_area: '$greater_toronto_area',
          auction_end_time: '$auction_end_time',
          current_bid_amount: '$current_bid_amount',
          total_bids: '$total_bids',
          featured: '$featured',
          adz_type: '$adz_type',
          status: '$status',
          reserve: '$reserve',
          createdAt: '$createdAt',
          feature_image: '$feature_image'
        },
      },
      {
        $sort: sortQuery,
      }
    ]).exec();
    return auctions;
  },

  getUserBidHistory: async (userId, request) => {

    let {
      limit, offset
    } = request.query;
    limit = parseInt(limit, 10) || 8;
    offset = parseInt(offset, 10) || 0;
    
    const userBidedAuctions = await BidModel.find({user: userId}).distinct('auction_id');
    const searchQuery = { status: { $nin: ['deleted'] }, _id: { $in: userBidedAuctions }, adz_type: 'auction' };
    let sortQuery = { auction_end_time: -1 };
    const total = await AuctionModel.countDocuments(searchQuery);
    let auctions = await AuctionModel.aggregate([
      { $match: searchQuery },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'seller',
        },
      },
      {
        $unwind: {
          path: '$seller',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'bids',
          let: { auction_id: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$user', mongoose.Types.ObjectId(userId)] }, { $eq: ['$auction_id', '$$auction_id'] }],
                },
              },
            },
            {
              $sort: { amount: -1 },
            },
            {
              $limit: 1,
            },
          ],
          as: 'bidData',
        },
      },
      {
        $unwind: {
          path: '$bidData',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: '$_id',
          title: '$title',
          sub_title: '$sub_title',
          slug: '$slug',
          seller_id: '$user',
          seller_email: '$seller.email',
          seller_user_name: '$seller.user_name',
          location: '$location',
          greater_toronto_area: '$greater_toronto_area',
          auction_end_time: '$auction_end_time',
          current_bid_amount: '$current_bid_amount',
          total_bids: '$total_bids',
          featured: '$featured',
          adz_type: '$adz_type',
          status: '$status',
          reserve: '$reserve',
          createdAt: '$createdAt',
          feature_image: '$feature_image',
          user_bid_amount: '$bidData.amount',
        },
      },
      {
        $sort: sortQuery,
      },
      {
        $skip: offset,
      },
      {
        $limit: limit,
      },
    ]).exec();
    return { 
      auctions,
      filters: { total, limit, offset }
    };
  },
};

module.exports = AuctionService;

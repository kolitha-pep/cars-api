const baseJoi = require('joi');
const extension = require('joi-date-extensions');
const mongoose = require('mongoose');
const log = require('simple-node-logger').createSimpleLogger();
const _ = require('lodash');
const CommentModel = require('../models/CommentModel');
const AuctionModel = require('../models/AuctionModel');

const CommentService = {

  getComments: async (auctionId) => {
      let comments = await CommentService.getCommentsForSelectedFilters(
        { auction_id: auctionId, reply: false, status: 'active' }
      );
      comments = await comments.map(async comment => {
        const replies = await CommentService.getCommentsForSelectedFilters(
          { auction_id: auctionId, reply: true, status: 'active', parent_comment_id: mongoose.Types.ObjectId(comment._id) }
        );
        comment.replies = replies;
        return comment;
      });
      comments = await Promise.all(comments);
      return comments;
  },

  getCommentsBySlug: async (slug) => {

    const auction = await AuctionModel.findOne({ slug })
      .lean().exec();
    if (!auction) {
      throw new Error('Cannot find an auction for this slug');
    }
    const auctionId = auction._id.toString();
    let comments = await CommentService.getCommentsForSelectedFilters(
      { auction_id: auctionId, reply: false, status: 'active' }
    );
    comments = await comments.map(async comment => {
      const replies = await CommentService.getCommentsForSelectedFilters(
        { auction_id: auctionId, reply: true, status: 'active', parent_comment_id: mongoose.Types.ObjectId(comment._id) }
      );
      comment.replies = replies;
      return comment;
    });
    comments = await Promise.all(comments);
    return comments;
},

  getCommentsCount: async (auctionId) => {
    const commentCount = await CommentModel.countDocuments({ auction_id: auctionId, status: 'active' });
    return commentCount;
},

  getCommentsForSelectedFilters: async (match) => {
    try {
      const comments = await CommentModel.aggregate([
        { $match: match },
        {
          $lookup:
            {
              from: "users",
              localField: "user",
              foreignField: "_id",
              as: "user"
            }
        },
        {
          $unwind:
            {
              path: "$user",
              preserveNullAndEmptyArrays: true
            }
        },
        {
          $project: {
            _id: '$_id',
            type: '$type',
            inappropriate: '$inappropriate',
            inappropriate_marked_user: '$inappropriate_marked_user',
            up_votes: '$up_votes',
            up_votes_users: '$up_votes_users',
            comment: '$comment',
            createdAt: '$createdAt',
            'user._id': '$user._id',
            'user.first_name': '$user.first_name',
            'user.last_name': '$user.last_name',
            'user.user_name': '$user.user_name',
            'user.email': '$user.email',
            'user.avatar': '$user.avatar'
          },
        },
        {
          $sort: { createdAt: -1 },
        }
      ]).exec();
      return comments;
    } catch (error) {
      log.error('CommentService getCommentsForSelectedFilters error ', error);
      return [];
    }
  }
};

module.exports = CommentService;

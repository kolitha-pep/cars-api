const baseJoi = require('joi');
const extension = require('joi-date-extensions');
const config = require('config');
const CommentModel = require('../../models/CommentModel');
const responseService = require('../../services/ResponseService');
const CommentService = require('../../services/CommentService');
const { newCommentValidateSchema } = require('../../schemas/CommentSchema');
const log = require('simple-node-logger').createSimpleLogger();
const Joi = baseJoi.extend(extension);

const CommentController = {

  addComment: async (request, response) => {
    try {
      let validation = Joi.validate(request.body, newCommentValidateSchema);
      if (validation && validation.error) {
        const errorMessage = validation.error.details[0] ? (validation.error.details[0].message || 'not found') : 'not found';
        responseService.response(response, config.RESPONSE.CODE.ERROR, errorMessage);
      } else {
        const commentData = {};
        commentData.comment = request.body.comment;
        commentData.auction_id = request.body.auction_id;
        commentData.user = request.user._id;
        commentData.reply = (request.body.reply) ? true : false;
        commentData.type = (request.user.role === config.USER_TYPES.ADMIN) ? 'admin_message' : 'text';
        if (commentData.reply) {
          if (!request.body.parent_comment_id) {
            responseService.response(response, config.RESPONSE.CODE.ERROR, 'parent_comment_id required');
          }
          commentData.parent_comment_id = request.body.parent_comment_id;
        }
        const commentResponse = await CommentModel.create(commentData);
        responseService.success(response, { 
          comment: commentResponse,
          user: { 
            _id: request.user._id,
            first_name: request.user.first_name,
            last_name: request.user.last_name,
            user_name: request.user.user_name,
            email: request.user.email,
            avatar: request.user.avatar,
          }
        });
      }
    } catch (error) {
      log.error('CommentController addComment error ', error);
      responseService.error(response, error);
    }
  },

  getComments: async (req, res) => {
    try {
      const auctionId = req.params.auction_id || null;
      const comments = await CommentService.getComments(auctionId);
      responseService.success(res, comments);
    } catch (error) {
      log.error('CommentController getComments error ', error);
      responseService.error(res, error.message);
    }
  },

  getCommentsBySlug: async (req, res) => {
    try {
      const slug = req.params.slug || null;
      const comments = await CommentService.getCommentsBySlug(slug);
      responseService.success(res, comments);
    } catch (error) {
      log.error('CommentController getComments error ', error);
      responseService.error(res, error.message);
    }
  },

  markInappropriate: async (req, res) => {
    try {
      const commentId = req.params.comment_id || null;
      const value = (req.params.value == 'true') ? true : false;
      if (!commentId) {
        responseService.response(res, config.RESPONSE.CODE.ERROR, 'comment_id is required');
      }
      let updateValues = { inappropriate: false, inappropriate_marked_user: null };
      if (value) {
        updateValues = { inappropriate: true, inappropriate_marked_user: req.user._id };
      }
      await CommentModel.findOneAndUpdate(
        { _id: commentId },
        { $set: updateValues }
      );
      responseService.success(res, 'Comment inappropriate status updated successfully');
    } catch (error) {
      log.error('CommentController markInappropriate error ', error);
      responseService.error(res, error.message);
    }
  },

  upVote: async (req, res) => {
    try {
      const commentId = req.params.comment_id || null;
      if (!commentId) {
        responseService.response(res, config.RESPONSE.CODE.ERROR, 'comment_id is required');
      }
      const comment = await CommentModel.findOne(
        { _id: commentId }
      );
      const userId = req.user._id.toString();
      const alreadyVoted = comment.up_votes_users.includes(userId);
      const updateData = {};
      let upVoteUsers = comment.up_votes_users;
      if (alreadyVoted) {
        updateData.up_votes = comment.up_votes - 1;
        upVoteUsers = upVoteUsers.filter(e => e !== userId);
      } else {
        updateData.up_votes = comment.up_votes + 1;
        upVoteUsers.push(userId);
      }
      updateData.up_votes_users = upVoteUsers;

      await CommentModel.findOneAndUpdate(
        { _id: commentId },
        { $set: updateData }
      );
      responseService.success(res, updateData );
    } catch (error) {
      log.error('CommentController upVote error ', error);
      responseService.error(res, error.message);
    }
  },

  delete: async (request, response) => {
    try {
      const commentId = request.params.id || null;
      await CommentModel.findOneAndUpdate(
        { _id: commentId },
        { $set: { status: 'deleted' } }
      );
      responseService.success(response, 'Comment deleted successfully');
    } catch (error) {
      log.error('CommentController delete error ', error);
      responseService.error(response, error);
    }
  },
};

module.exports = CommentController;

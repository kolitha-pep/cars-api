const baseJoi = require('joi');
const extension = require('joi-date-extensions');

const Joi = baseJoi.extend(extension);

const newCommentValidateSchema = Joi.object().keys({

  comment: Joi.string().required(),
  auction_id: Joi.string().required(),
  reply: Joi.boolean().required(),
  parent_comment_id: Joi.string().allow(null).allow('')
});

module.exports = {
  newCommentValidateSchema
};

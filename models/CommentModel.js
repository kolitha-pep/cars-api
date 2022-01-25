const mongoose = require('mongoose');

const { Schema, Types } = mongoose;
const commentSchema = new Schema({

  comment: String,
  type: {
    type: String,
    enum: ['text', 'bid', 'admin_message'],
    default: 'text',
  },
  auction_id: {
    type:String,
    required: Types.ObjectId
  },
  user: {
    type: Types.ObjectId
  },
  user_batch: {
    type: String
  },
  inappropriate: {
    type: Boolean,
    default: false,
  },
  inappropriate_marked_user: {
    type: String,
    default: null,
  },
  up_votes: {
    type: Number,
    default: 0
  },
  up_votes_users: {
    type: Array,
    default: []
  },
  reply: {
    type: Boolean,
    default: false
  },
  parent_comment_id: {
    type: Types.ObjectId,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'deleted'],
    default: 'active',
  }
}, { timestamps: true, collation: { locale: 'en_US', strength: 1 } });

module.exports = mongoose.model('Comment', commentSchema);
const mongoose = require('mongoose');

const { Schema, Types } = mongoose;
const bidSchema = new Schema({

  amount: {
    type: Number,
    required: true
  },
  hold_amount: {
    type: Number,
    required: true
  },
  auction_id: {
    type: Types.ObjectId,
    required: true,
  },
  user: {
    type: Types.ObjectId,
    required: true,
  },
  highest_bid: {
    type: Boolean,
    default: true,
  },
  stripe_charge_id: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  }
}, { timestamps: true, collation: { locale: 'en_US', strength: 1 } });

module.exports = mongoose.model('Bid', bidSchema);
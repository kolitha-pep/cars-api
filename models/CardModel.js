const mongoose = require('mongoose');

const { Schema, Types } = mongoose;
const cardSchema = new Schema({

  stripe_card_id: {
    type: String,
    required: true
  },
  stripe_card_number: {
    type: String,
    required: true
  },
  user: {
    type: Types.ObjectId
  },
  type: {
    type: String,
    default: true,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  }
}, { timestamps: true, collation: { locale: 'en_US', strength: 1 } });

module.exports = mongoose.model('Card', cardSchema);
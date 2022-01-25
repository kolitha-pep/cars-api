const mongoose = require('mongoose');

const { Schema, Types } = mongoose;
const auctionSchema = new Schema({

  title: String,
  sub_title: String,
  slug: String,
  user: {
    type: Types.ObjectId,
    default: null
  },
  year_of_made: {
    type: String,
    default: null,
  },
  make: {
    type: String,
    default: null,
  },
  model: {
    type: String,
    default: null,
  },
  vin: {
    type: String,
    default: null,
  },
  mileage: {
    type: String,
    default: null,
  },
  reserve: {
    type: Boolean,
    default: false
  },
  reserve_price: {
    type: String,
    default: 0
  },
  location: {
    type: String,
    default: null,
  },
  greater_toronto_area: {
    type: Boolean,
    default: false,
  },
  body_style: {
    type: String,
    default: null,
  },
  engine_capacity: {
    type: String,
    default: null,
  },
  drivetrain: {
    type: String,
    default: null,
  },
  transmission: {
    type: String,
    default: null,
  },
  exterior_color: {
    type: String,
    default: null,
  },
  interior_color: {
    type: String,
    default: null,
  },
  title_status: {
    type: String,
    default: null,
  },
  seller_type: {
    type: String,
    default: null,
  },
  vehicle_history_report_link: {
    type: String,
    default: null,
  },
  feature_image: {
    type: String,
    default: null,
  },
  gallery_images: {
    type: Array,
    default: [],
  },
  videos: {
    type: Array,
    default: [],
  },
  sub_sections: {
    type: Array,
    default: [],
  },
  auction_start_time: {
    type: Date,
    default: null
  },
  auction_end_time: {
    type: Date,
    default: null
  },
  current_bid_amount: {
    type: Number,
    default: null
  },
  current_bid_id: {
    type: Types.ObjectId,
    default: null
  },
  total_bids: {
    type: Number,
    default: 0
  },
  featured: {
    type: Boolean,
    default: false
  },
  adz_type: {
    type: String,
    default: 'auction',
    enum: ['auction', 'found_in_market']
  },
  status: {
    type: String,
    enum: ['active', 'finished', 'rejected', 'deleted', 'reserve_not_met'],
    default: 'active',
  },
  end_reason: {
    type: String,
    default: null
  },
  hide_user_email: {
    type: Boolean,
    default: false
  },
}, { timestamps: true, collation: { locale: 'en_US', strength: 1 } });

module.exports = mongoose.model('Auction', auctionSchema);
const mongoose = require('mongoose');

const { Schema } = mongoose;

const carSchema = new Schema({
  user: {
    type: Schema.ObjectId,
    default: null
  },
  seller_type: {
    type: String,
    default: null,
  },
  seller_name: {
    type: String,
    default: null,
  },
  phone_number: {
    type: String,
    default: null,
  },
  year: {
    type: Number,
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
  features: {
    type: String,
    default: null,
  },
  location: {
    type: String,
    default: null,
  },
  is_vehicle_titled: {
    type: Boolean,
    default: false,
  },
  is_there_lienholder: {
    type: Boolean,
    default: false,
  },
  title_status: {
    type: String,
    default: null,
  },
  billing_type: {
    type: String,
    default: false,
  },
  reserve_price: {
    type: Number,
    default: null,
  },
  photos: {
    type: Array,
    default: [],
  },
  status: {
    type: String,
    default: 'pending',
  },
  charge_id: {
    type: String,
    default: null,
  }
}, { timestamps: true, collation: { locale: 'en_US', strength: 1 } });

module.exports = mongoose.model('Cars', carSchema);

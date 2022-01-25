const mongoose = require('mongoose');

const { Schema } = mongoose;

const userSchema = new Schema({
  first_name: {
    type: String,
    default: null,
  },
  last_name: {
    type: String,
    default: null,
  },
  user_name: {
    type: String,
    default: null,
  },
  contact_no: {
    type: String,
    default: null,
  },
  email: String,
  password: String,
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  password_reset_request_time: Date,
  password_reset_token: String,
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  avatar: {
    type: String,
    default: null,
  },
  stripe_customer: String,
  wish_list: {
    type: Array,
    default: [],
  },
  tokens:[{
    token:{
      type:String,
      required: true
    }
  }],
}, { timestamps: true, collation: { locale: 'en_US', strength: 1 } });

module.exports = mongoose.model('User', userSchema);

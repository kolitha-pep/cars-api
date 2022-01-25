const baseJoi = require('joi');
const extension = require('joi-date-extensions');

const Joi = baseJoi.extend(extension);

const newAuctionValidateSchema = Joi.object().keys({

  title: Joi.string().required(),
  sub_title: Joi.string().allow(null).allow(''),
  user: Joi.string().allow(null).allow(''),
  reserve: Joi.boolean().required(),
  year_of_made: Joi.string().allow(null).allow(''),
  make: Joi.string().allow(null).allow(''),
  model: Joi.string().allow(null).allow(''),
  vin: Joi.string().allow(null).allow(''),
  mileage: Joi.string().allow(null).allow(''),
  reserve_price: Joi.string().allow(null).allow(''),
  location: Joi.string().allow(null).allow(''),
  body_style: Joi.string().allow(null).allow(''),
  engine_capacity: Joi.string().allow(null).allow(''),
  drivetrain: Joi.string().allow(null).allow(''),
  transmission: Joi.string().allow(null).allow(''),
  exterior_color: Joi.string().allow(null).allow(''),
  interior_color: Joi.string().allow(null).allow(''),
  title_status: Joi.string().allow(null).allow(''),
  seller_type: Joi.string().allow(null).allow(''),
  vehicle_history_report_link: Joi.string().allow(null).allow(''),
  feature_image: Joi.string().allow(null).allow(''),
  gallery_images: Joi.array().allow(null).allow(''),
  videos: Joi.array().allow(null).allow(''),
  sub_sections: Joi.array().allow(null).allow(''),
  adz_type: Joi.string().allow(null).allow(''),
  featured: Joi.boolean().allow(null).allow(''),
  greater_toronto_area: Joi.boolean()
});

const updateAuctionValidateSchema = Joi.object().keys({
  year_of_made: Joi.string().allow(null).allow(''),
  sub_title: Joi.string().allow(null).allow(''),
  make: Joi.string().allow(null).allow(''),
  model: Joi.string().allow(null).allow(''),
  vin: Joi.string().allow(null).allow(''),
  mileage: Joi.string().allow(null).allow(''),
  reserve_price: Joi.string().allow(null).allow(''),
  location: Joi.string().allow(null).allow(''),
  body_style: Joi.string().allow(null).allow(''),
  engine_capacity: Joi.string().allow(null).allow(''),
  drivetrain: Joi.string().allow(null).allow(''),
  transmission: Joi.string().allow(null).allow(''),
  exterior_color: Joi.string().allow(null).allow(''),
  interior_color: Joi.string().allow(null).allow(''),
  title_status: Joi.string().allow(null).allow(''),
  seller_type: Joi.string().allow(null).allow(''),
  vehicle_history_report_link: Joi.string().allow(null).allow(''),
  feature_image: Joi.string().allow(null).allow(''),
  gallery_images: Joi.array().allow(null).allow(''),
  videos: Joi.array().allow(null).allow(''),
  sub_sections: Joi.array().allow(null).allow(''),
  featured: Joi.boolean().allow(null).allow(''),
  greater_toronto_area: Joi.boolean(),
  auction_end_time: Joi.string().allow(null).allow(''),
  hide_user_email: Joi.boolean()
});

module.exports = {
  newAuctionValidateSchema,
  updateAuctionValidateSchema,
};

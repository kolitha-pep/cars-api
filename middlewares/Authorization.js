const config = require('config');
const jwt = require('jsonwebtoken');
const ResponseService = require('../services/ResponseService');
const User = require('../models/UserModel');

module.exports = async (req, res, next) => {
  try {
    const { authorization } = req.headers;
    if (!authorization) {
      throw new Error('Please sign-in before this action');
    }

    const token = authorization.split(' ');
    let decoded  = jwt.verify(token[1], config.JWT_SECRET);
    decoded = JSON.parse(JSON.stringify(decoded));
    const user  = await User.findOne({ _id: decoded.id, 'tokens.token': token[1]});
    if (!user) {
      throw new Error('User not found. Please sign-in again');
    }

    req.user = user;
    next();
  } catch (error) {
    ResponseService.unauthorized(res, error);
  }
};

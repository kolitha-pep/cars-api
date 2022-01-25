const ResponseService = require('../../services/ResponseService');
const AuctionService = require('../../services/AuctionService');
const BidService = require('../../services/BidService');
const log = require('simple-node-logger').createSimpleLogger();

const AuctionController = {

  /**
   * List all auctions
   *
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  getList: async (req, res) => {
    try {
      const request = req.query;
      const result = await AuctionService.getList(request);
      ResponseService.success(res, result);
    } catch (error) {
      log.error('AuctionController getList error ', error);
      ResponseService.error(res, error.message);
    }
  },

  /**
   * Create new auctions
   * @param request
   * @param response
   * @returns {Promise<void>}
   */
  create: async (request, response) => {
    try {
      const result = await AuctionService.save(request.body);
      ResponseService.success(response, result);
    } catch (error) {
      log.error('AuctionController create error ', error);
      ResponseService.error(response, error);
    }
  },

  /**
   * Update auctions by id
   * @param request
   * @param response
   * @returns {Promise<void>}
   */
  update: async (request, response) => {
    try {
      const auctionId = request.params.id || null;
      const result = await AuctionService.update(request.body, auctionId);
      ResponseService.success(response, result);
    } catch (error) {
      log.error('AuctionController update error ', error);
      ResponseService.error(response, error);
    }
  },

  /**
   * Remove auctions by id
   * @param request
   * @param response
   * @returns {Promise<void>}
   */
  remove: async (request, response) => {
    try {
      const auctionId = request.params.id || null;
      const result = await AuctionService.remove(auctionId);
      ResponseService.success(response, result);
    } catch (error) {
      log.error('AuctionController remove error ', error);
      ResponseService.error(response, error);
    }
  },

  /**
   * Reject auctions by id
   * @param request
   * @param response
   * @returns {Promise<void>}
   */
  reject: async (request, response) => {
    try {
      const auctionId = request.params.id || null;
      const result = await AuctionService.reject(auctionId);
      ResponseService.success(response, result);
    } catch (error) {
      log.error('AuctionController reject error ', error);
      ResponseService.error(response, error);
    }
  },

  /**
   * Get auctions data by Id
   * @param request
   * @param response
   * @returns {Promise<void>}
   */
  getById: async (request, response) => {
    try {
      const auctionId = request.params.id || null;
      const result = await AuctionService.getById(auctionId);
      ResponseService.success(response, result);
    } catch (error) {
      log.error('AuctionController getById error ', error);
      ResponseService.error(response, error);
    }
  },

  getAuctionsToHome: async (req, res) => {
    try {
      const request = req.query;
      const result = await AuctionService.getAuctionsToHome(request);
      ResponseService.success(res, result);
    } catch (error) {
      log.error('AuctionController getAuctionsToHome error ', error);
      ResponseService.error(res, err.message);
    }
  },

  getAuctionDetails: async (request, response) => {
    try {
      const auctionId = request.params.id || null;
      const result = await AuctionService.getDetailsByIdForFrontend(auctionId);
      ResponseService.success(response, result);
    } catch (error) {
      log.error('AuctionController getAuctionDetails error ', error);
      ResponseService.error(response, error);
    }
  },

  getAuctionDetailsBySlug: async (request, response) => {
    try {
      const auctionSlug = request.params.slug || null;
      const result = await AuctionService.getDetailsBySlugForFrontend(auctionSlug);
      ResponseService.success(response, result);
    } catch (error) {
      log.error('AuctionController getAuctionDetails error ', error);
      ResponseService.error(response, error);
    }
  },

  /**
   * List user bid history
   *
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  getUserBidHistory: async (request, response) => {
    try {
      const userId = request.params.id || null;
      const result = await AuctionService.getUserBidHistory(userId, request);
      ResponseService.success(response, result);
    } catch (error) {
      log.error('AuctionController getUserBidHistory error ', error);
      ResponseService.error(response, error.message);
    }
  },
};
module.exports = AuctionController;

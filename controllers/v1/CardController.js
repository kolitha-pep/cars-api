const ResponseService = require('../../services/ResponseService');
const StripeService = require('../../services/StripeService');
const log = require('simple-node-logger').createSimpleLogger();

const CardController = {

  /**
   * Create new card and if exist change the default card
   * @param request
   * @param response
   * @returns {Promise<void>}
   */
  create: async (request, response) => {
    try {
      const result = await StripeService.createCard(request.body, request.user);
      ResponseService.success(response, result);
    } catch (error) {
      log.error('CardController create error ', error);
      ResponseService.error(response, error);
    }
  },

  /**
   * Get card details by user
   * @param request
   * @param response
   * @returns {Promise<void>}
   */
  getCardByUser: async (request, response) => {
    try {
      const result = await StripeService.getByUser(request.user);
      ResponseService.success(response, result);
    } catch (error) {
      ResponseService.error(response, error);
    }
  }

};

module.exports = CardController;

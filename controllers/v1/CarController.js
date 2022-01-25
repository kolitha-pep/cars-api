const ResponseService = require('../../services/ResponseService');
const CarService = require('../../services/CarService');

const CarController = {
  /**
   * Create new sell a car request
   * @param request
   * @param response
   * @returns {Promise<void>}
   */
  postCar: async (request, response) => {
    try {
      const result = await CarService.postCar(request.user, request.body);
      ResponseService.success(response, result);
    } catch (error) {
      ResponseService.error(response, error);
    }
  },
  getList: async (request, response) => {
    try {
      const result = await CarService.getCars(request.query);
      ResponseService.success(response, result);
    } catch (error) {
      ResponseService.error(response, error);
    }
  },
  getById: async (request, response) => {
    try {
      const carId = request.params.id
      const result = await CarService.getById(carId);
      ResponseService.success(response, result);
    } catch (error) {
      ResponseService.error(response, error);
    }
  },

  approve: async (request, response) => {
    try {
      const carId = request.params.id
      const result = await CarService.approve(carId);
      ResponseService.success(response, result);
    } catch (error) {
      ResponseService.error(response, error);
    }
  },

  reject: async (request, response) => {
    try {
      const carId = request.params.id;
      const result = await CarService.reject(carId);
      ResponseService.success(response, result);
    } catch (error) {
      ResponseService.error(response, error);
    }
  },

  remove: async (request, response) => {
    try {
      await CarService.deleteCar(request.params. id);
      ResponseService.success(response, 'Car details successfully deleted.');
    } catch (error) {
      ResponseService.error(response, error);
    }
  },
};
module.exports = CarController;

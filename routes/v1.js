const express = require('express');
const Authorization = require('../middlewares/Authorization');
const AdminAuthorization = require('../middlewares/AdminAuthorization');

const router = express.Router();

const AuctionController = require('../controllers/v1/AuctionController');
const UserController = require('../controllers/v1/UserController');
const CarController = require('../controllers/v1/CarController');
const CardController = require('../controllers/v1/CardController');
const WishListController = require('../controllers/v1/WishListController');
const CommentController = require('../controllers/v1/CommentController');
const BidController = require('../controllers/v1/BidController');

// Free routes
router.post('/login', UserController.login);
router.post('/logout', UserController.logout);
router.post('/sign-up', UserController.signUp);
router.post('/forgot-password', UserController.forgotPassword);

router.get('/auctions', AuctionController.getAuctionsToHome);
router.get('/auctions/:id', AuctionController.getAuctionDetails);
router.get('/auctions-by-slug/:slug', AuctionController.getAuctionDetailsBySlug);

router.get('/comments/:auction_id', CommentController.getComments);
router.get('/comments-by-slug/:slug', CommentController.getCommentsBySlug);

router.get('/user/profile/:id', UserController.getProfile); 
router.get('/user/bid-history/:id', AuctionController.getUserBidHistory); 

// User routes
router.get('/user/own-profile', Authorization, UserController.getOwnProfile);
router.put('/user/profile', Authorization, UserController.updateProfile);
router.post('/user/reset-password', Authorization, UserController.resetPassword);
router.post('/user/car', Authorization, CarController.postCar);

router.post('/user/card', Authorization, CardController.create);
router.get('/user/card', Authorization, CardController.getCardByUser);

router.post('/user/wish-list', Authorization, WishListController.create);
router.get('/user/wish-list', Authorization, WishListController.getWishList);
router.get('/user/wish-list-auction-ids', Authorization, WishListController.getWishListIds);
router.delete('/user/wish-list/:auction_id', Authorization, WishListController.remove);

router.post('/comments', Authorization, CommentController.addComment);
router.put('/comments/mark-inappropriate/:comment_id/:value', Authorization, CommentController.markInappropriate);
router.put('/comments/up-vote/:comment_id', Authorization, CommentController.upVote);

router.post('/user/bid', Authorization, BidController.addBid);

// Admin routes
router.get('/admin/auctions', AdminAuthorization, AuctionController.getList);
router.post('/admin/auctions', AdminAuthorization, AuctionController.create);
router.put('/admin/auctions/:id', AdminAuthorization, AuctionController.update);
router.get('/admin/auctions/:id', AdminAuthorization, AuctionController.getById);
router.delete('/admin/auctions/:id', AdminAuthorization, AuctionController.remove);
router.delete('/admin/auction-reject/:id', AdminAuthorization, AuctionController.reject);

router.get('/admin/cars', AdminAuthorization, CarController.getList);
router.get('/admin/car/:id', AdminAuthorization, CarController.getById);
router.put('/admin/car-approve/:id', AdminAuthorization, CarController.approve);
router.delete('/admin/car-reject/:id', AdminAuthorization, CarController.reject);
router.delete('/admin/car/:id', AdminAuthorization, CarController.remove);

router.get('/admin/user/list', AdminAuthorization, UserController.getUserList);

router.delete('/comments/:id', AdminAuthorization, CommentController.delete);

// APIS todo

//admin get cars
//admin view car
//admin approve/reject cars

module.exports = router;

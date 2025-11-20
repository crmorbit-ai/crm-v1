const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getCalls,
  getCall,
  createCall,
  updateCall,
  deleteCall
} = require('../controllers/callController');

router.use(protect);

router.route('/')
  .get(getCalls)
  .post(createCall);

router.route('/:id')
  .get(getCall)
  .put(updateCall)
  .delete(deleteCall);

module.exports = router;
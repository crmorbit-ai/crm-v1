const express = require('express');
const router = express.Router();
const {
  createTicket,
  getAllTickets,
  getTicket,
  addMessage,
  updateTicketStatus,
  assignTicket,
  getTicketStats,
  deleteTicket
} = require('../controllers/supportTicketController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Statistics route (BEFORE /:id route)
router.get('/stats', getTicketStats);

// CRUD routes
router.route('/')
  .get(getAllTickets)
  .post(createTicket);

router.route('/:id')
  .get(getTicket)
  .delete(deleteTicket);

// Ticket operations
router.post('/:id/messages', addMessage);
router.put('/:id/status', updateTicketStatus);
router.put('/:id/assign', assignTicket);

module.exports = router;

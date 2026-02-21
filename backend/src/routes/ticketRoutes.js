const express = require('express');
const router = express.Router();
const controller = require('../controllers/ticketController'); // Aponta para ticketController
const { protect, monitor } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validateMiddleware');
const schemas = require('../validators/schemas');

router.use(protect);

// 📋 Listagem de Tickets
router.get('/', controller.getMyTickets); // Lista os meus
router.get('/room-tickets', controller.getRoomTickets); // Lista os da sala

// ❌ Cancelar Ticket (Devolução)
router.delete('/:id', controller.cancelTicket);

// 🛡️ Validação (Scanner) - Monitor/Admin/Armada
router.post('/validate', protect, monitor, validate(schemas.tickets.validate), controller.validateTicket);

module.exports = router;
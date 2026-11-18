const express = require('express');
const router = express.Router();
const benchmarkController = require('../controllers/benchmarkController');

// Public benchmark & telemetry inspection (for academic viva & architecture defense)
router.get('/telemetry', benchmarkController.runLiveBenchmark);
router.post('/run', benchmarkController.runLiveBenchmark);

module.exports = router;

const { Router } = require('express');

const { analyzeDocument } = require('../controllers/azure');

const router = Router();

router.get('/', analyzeDocument);

module.exports = router;
const express = require('express');
const router = express.Router();
const noteController = require('../controllers/notecontroller');
const authenticate=require('../middlewares/authenticate');

router.get('/', authenticate,noteController.getNotes);

router.post('/', authenticate, noteController.createNote);

router.put('/:id', authenticate, noteController.updateNote);

router.post('/:id/summarize', authenticate, noteController.summarizeNote);

router.post('/:id/keywords', authenticate,noteController.extractKeywords);

router.delete('/:id', authenticate,noteController.deleteNote);
module.exports = router;

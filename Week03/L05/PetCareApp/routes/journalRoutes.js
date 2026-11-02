const express = require('express');
const { isLoggedIn } = require('../middleware/auth');
const journalController = require('../controllers/journalController');

const router = express.Router();

router.get('/journals', isLoggedIn, journalController.listJournals);
router.get('/journals/new', isLoggedIn, journalController.showNewJournalForm);
router.post('/journals/new', isLoggedIn, journalController.createJournal);
router.get('/journals/edit/:id', isLoggedIn, journalController.showEditJournalForm);
router.post('/journals/edit/:id', isLoggedIn, journalController.editJournal);
router.get('/journals/delete/:id', isLoggedIn, journalController.deleteJournal);
router.get('/journals/search', isLoggedIn, journalController.searchJournals);

module.exports = router;

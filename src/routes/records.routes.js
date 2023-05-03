const { Router } = require('express');

const loginValidation = require('../middleware/login');
const { getRecords, newRecord, editRecord, deleteRecord, getAllRecords, getRecord } = require('../controllers/user.controllers')
const router = Router()


router.route('/').get(loginValidation, getRecords) 
router.route('/:id').get(loginValidation, getRecord) 
router.route('/').post(loginValidation, newRecord)
router.route('/all/getAll').get(loginValidation, getAllRecords)
router.route('/editRecord/:id').post(loginValidation, editRecord)
router.route('/deleteRecord/:id').post(loginValidation, deleteRecord)
 
module.exports = router
const { Router } = require('express');

const loginValidation = require('../middleware/login');
const { createUser, login, logOffs, pruebaLogin, editUser, deleteUser, involvedRegister, getInvolves, editInvolved, getUserBasicInfo, incompleteCount,getLastIncomplete, getUsers, testEncrypt } = require('../controllers/user.controllers')
const router = Router()


router.route('/').post(loginValidation,createUser)
router.route('/login').post(login)
router.route('/logoff').get(logOffs)
router.route('/pruebalogin').get(loginValidation, pruebaLogin)
router.route('/edituser').post(loginValidation, editUser)
router.route('/deleteuser').post(loginValidation, deleteUser)
router.route('/involvedRegister').post(loginValidation, involvedRegister)
router.route('/getinvolved/:id').get(loginValidation, getInvolves)
router.route('/editinvolved').post(loginValidation, editInvolved)
router.route('/getUserInfo').get(loginValidation, getUserBasicInfo)
router.route('/getIncompleteRegisters').get(loginValidation, incompleteCount)
router.route('/getlastincomplete').get(loginValidation, getLastIncomplete)
router.route('/getagents').get(loginValidation, getUsers)
router.route('/encription').post( testEncrypt)


module.exports = router
const { Router } = require('express');
const { check } = require('express-validator');
const { getUsers, createUser, updateUser, deleteUser } = require('../controllers/users');
const { validateFields, validateJWT, userIsAdmin } = require('../middlewares');
const { validateIfEmailExists, isValidRole, existsUserById } = require('../helpers/db-validators');

const router = Router();

router.get('/', getUsers);
router.post('/', [
    check('name', 'Name is required').not().isEmpty(),
    check('password', 'Password is required and/or must be at least 6 characters').not().isEmpty().isLength({ min: 6 }),
    check('email', 'A valid Email is required').isEmail(),
    check('email').custom(validateIfEmailExists),
    check('role').custom(isValidRole),
    validateFields,
], createUser);
router.put('/:id', [
    check('id', 'Not a valid ID').isMongoId(),
    check('id').custom(existsUserById),
    check('role').custom(isValidRole),
    validateFields
], updateUser);
router.delete('/:id', [
    validateJWT,
    userIsAdmin,
    check('id', 'Not a valid ID').isMongoId(),
    check('id').custom(existsUserById),
], deleteUser);

module.exports = router;
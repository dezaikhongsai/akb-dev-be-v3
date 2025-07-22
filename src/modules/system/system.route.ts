import express from 'express';
import {
    createSystemController,
    getAllSystemController,
    getSystemByKeyController,
    updateSystemController,
    deleteSystemController,
} from './system.controller';
import { verifyToken ,authorize} from '../../common/middlewares';
const router = express.Router();

router.use(verifyToken , authorize('admin'));

router.post('/create' , createSystemController);
router.get('/all' , getAllSystemController);
router.get('/:key' , getSystemByKeyController);
router.patch('/:key' , updateSystemController);
router.delete('/:key' , deleteSystemController);

export default router;
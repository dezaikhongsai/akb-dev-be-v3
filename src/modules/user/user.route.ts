import express from 'express';
import { 
    createUserController, 
    deleteUserController, 
    getUserPaginationController, 
    meController, 
    statisticUserController, 
    updateUserController,
    autoSearchUserController,
    statisticUserProjectController
} from './user.controller';
import { verifyToken, authorize, validateRequest } from '../../common/middlewares';
import { createUserSchema, updateUserSchema } from './dto';

const router = express.Router();

router.get('/me', verifyToken, meController);
router.get('/statistic', verifyToken, authorize('admin'), statisticUserController);
router.get('/statistic-project', verifyToken, authorize('admin', 'pm'), statisticUserProjectController);
router.get('/auto-search', verifyToken, autoSearchUserController);
router.get('/pagination', verifyToken, authorize('admin' , 'pm' , 'customer'), getUserPaginationController);
router.post('/create', verifyToken, authorize('admin' , 'pm'), validateRequest(createUserSchema), createUserController);
router.patch('/update/:userId', verifyToken, updateUserController);
router.delete('/delete/:userId', verifyToken, authorize('admin' , 'pm'), deleteUserController);

export default router;

import {
    loginController,
    logoutController,
    refreshTokenController
} from './auth.controller';
import express from 'express';
import {validateRequest , verifyToken , verifyRefreshToken} from '../../common/middlewares';
import { loginSchema } from './dto';

const router = express.Router();

router.post('/login' ,validateRequest(loginSchema), loginController);
router.post('/logout' , verifyToken , logoutController);
router.post('/refresh-token' , verifyRefreshToken , refreshTokenController);

export default router;
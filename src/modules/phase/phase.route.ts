import express from 'express';
import {
    createPhaseController,
    createManyPhaseController,
    getPhaseByProjectIdController,
    updatePhaseController,
    updateManyPhaseController,
    deletePhaseController,
    deleteAllPhaseByProjectIdController,
} from './phase.controller';
import { verifyToken , authorize , validateRequest} from '../../common/middlewares';
import { createPhaseSchema, createManyPhaseSchema, updatePhaseSchema, updateManyPhaseSchema } from './dto/phase.validation';

const router = express.Router();

router.use(verifyToken , authorize('admin' , 'pm'));

router.post('/create', validateRequest(createPhaseSchema), createPhaseController);
router.post('/create-many', createManyPhaseController);
router.get('/get-by-project-id/:projectId', getPhaseByProjectIdController);
router.patch('/update/:phaseId', validateRequest(updatePhaseSchema), updatePhaseController);
router.patch('/update-many', updateManyPhaseController);
router.delete('/delete/:phaseId', deletePhaseController);
router.delete('/delete-all-by-project-id/:projectId', deleteAllPhaseByProjectIdController);

export default router;
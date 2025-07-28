import express from 'express';
import { activeProjectController, createProjectController, deleteProjectController, getAutoSearchProjectController, getProjectByIdController, getProjectPaginationController, getProjectStatisticsController, projectDetailStatisticsController, statisticsRequestInProjectController, updateProjectController } from './project.controller';
import { verifyToken } from '../../common/middlewares';
import { projectUpdateValidation, projectValidation } from './dto';
import { validateRequest } from '../../common/middlewares';
import { authorize } from '../../common/middlewares'; 

const router = express.Router();

router.use(verifyToken);

router.post('/create' , validateRequest(projectValidation) , createProjectController);
router.get('/get-by-id/:projectId' , getProjectByIdController);
router.get('/pagination' , getProjectPaginationController);
router.patch('/update/:projectId' , authorize('admin' , 'pm') , updateProjectController);
router.delete('/delete/:projectId' , authorize('admin' , 'pm'), validateRequest(projectUpdateValidation) , deleteProjectController);
router.get('/auto-search' , getAutoSearchProjectController);
router.get('/statistics' , getProjectStatisticsController); 
router.patch('/active/:projectId' , authorize('admin' , 'pm') , activeProjectController);
router.get('/statistics-detail/:projectId' , projectDetailStatisticsController);
router.get('/statistics-request' , statisticsRequestInProjectController);

export default router;
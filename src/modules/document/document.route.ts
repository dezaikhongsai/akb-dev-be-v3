import { Router } from 'express';
import { 
    createDocumentController ,
    getDocumentInProjectController, 
    updateDocumentController, 
    deleteDocumentController, 
    updateContentController, 
    deleteContentController, 
    addContentToDocumentController, 
    downloadFileController, 
    changeIsCompletedController,
    messageDocStatusController
} from './document.controller';
import { verifyToken , validateRequest } from '../../common/middlewares';
import { createDocumentSchema , createContentSchema} from './dto/document.validation';

const router = Router();

// Route tạo document mới
router.post('/create',verifyToken, createDocumentController);
router.post('/add-content/:documentId',verifyToken, addContentToDocumentController);
router.get('/get-in-project/:projectId',verifyToken, getDocumentInProjectController);
router.patch('/update/:documentId',verifyToken, updateDocumentController);
router.put('/update-content/:contentId',verifyToken, updateContentController);
router.delete('/delete/:documentId',verifyToken, deleteDocumentController);
router.delete('/delete-content/:contentId',verifyToken, deleteContentController);
router.get('/download/:filename',verifyToken, downloadFileController);
router.patch('/change-isCompleted/:documentId' , verifyToken , changeIsCompletedController);
router.get('/message-doc-status/:projectId' , verifyToken , messageDocStatusController);    

export default router;

import { Router } from "express";
import { 
    sendMailController, 
    sendMailTemplateController, 
    createMailConfigController, 
    getMailConfigController, 
    updateMailConfigController, 
    deleteMailConfigController,
    addToMailQueueController
} from "./mail.controller";
import { verifyToken , validateRequest} from "../../common/middlewares";
import { createMailConfigSchema } from "./dto/mail.validation";

const router = Router();
router.use(verifyToken);

router.post("/send-mail", sendMailController);
router.post("/send-mail-template", sendMailTemplateController);
router.post("/add-to-queue", addToMailQueueController);

router.post("/create-mail-config", verifyToken, validateRequest(createMailConfigSchema), createMailConfigController);
router.get("/get-mail-config", verifyToken, getMailConfigController);
router.put("/update-mail-config", verifyToken, validateRequest(createMailConfigSchema), updateMailConfigController);
router.delete("/delete-mail-config", verifyToken, deleteMailConfigController);

export default router;
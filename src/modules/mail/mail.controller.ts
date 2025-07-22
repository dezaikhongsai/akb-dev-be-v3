import { Request, Response } from "express";
import { createMailConfig, deleteMailConfig, getMailConfig, sendMail , sendMailWithTemplate, updateMailConfig, addToMailQueue } from "./mail.service";
import { IMailConfig } from "./dto";
import { ObjectId } from "mongoose";

export const sendMailController = async (req: Request, res: Response) => {
  try {
    const { to, subject, text, html } = req.body;
    const userId = req.user?._id as string;
    await sendMail({ to, subject, text, html, userId });
    res.status(200).json(
    { 
        success: true, 
        message: "Email sent successfully" 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const sendMailTemplateController = async(req : Request , res : Response) =>{
    try {
        const {to , subject , templateName , data} = req.body;
        const userId = req.user?._id as string;
        await sendMailWithTemplate(to, subject, templateName, data, userId);
        res.status(200).json({
            success : true,
            message : "Email sent"
        })
    } catch (error : any) {
        res.status(500).json({ success: false, message: error.message });
    }
}

export const createMailConfigController = async (req : Request , res : Response) => {
  try {
    const {serviceName , host , port , user , pass , secure , senderName , encryptMethod , isActive} = req.body; 
    const userId = req.user?._id as string | ObjectId;
    
    const mailConfig : IMailConfig = {
      serviceName , host , port , user , pass , secure , senderName , encryptMethod , createdAt : new Date() , createdBy : userId , isActive
    }
    const newMailConfig = await createMailConfig(mailConfig);
    res.status(200).json({
      success : true,
      message : "Cấu hình thành công !",
      data : newMailConfig
    })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export const getMailConfigController = async (req : Request , res : Response) => {
  try {
    const mailConfig = await getMailConfig(req);
    res.status(200).json({
      success : true,
      message : "Lấy mail config  thành công !",
      data : mailConfig
    })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export const updateMailConfigController = async (req : Request , res : Response) => {
  try {
    const {serviceName , host , port , user , pass , secure , senderName , encryptMethod , isActive} = req.body;
    const userId = req.user?._id as string | ObjectId;
    const mailConfig : IMailConfig = {
      serviceName , host , port , user , pass , secure , senderName , encryptMethod , createdAt : new Date() , createdBy : userId , isActive
    }
    const updatedMailConfig = await updateMailConfig(req , mailConfig);
    res.status(200).json({
      success : true,
      message : "Cập nhật cấu hình thành công !",
      data : updatedMailConfig
    })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export const deleteMailConfigController = async (req : Request , res : Response) => {
  try {
    const deletedMailConfig = await deleteMailConfig(req);
    res.status(200).json({
      success : true,
      message : "Xóa cấu hình thành công !",
      data : deletedMailConfig
    })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export const addToMailQueueController = async (req: Request, res: Response) => {
    try {
        const { 
            to, 
            subject, 
            templateName, 
            templateData,
            cc,
            bcc,
            priority,
            scheduledFor 
        } = req.body;

        const userId = req.user?._id as string;
        
        const mailQueue = await addToMailQueue(
            to,
            subject,
            templateName,
            templateData,
            userId,
            { cc, bcc, priority, scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined }
        );

        res.status(200).json({
            success: true,
            message: "Đã thêm mail vào hàng đợi",
            data: mailQueue
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};
import { addToMailQueue } from './mail.service';
import { ObjectId } from 'mongoose';
import { Request } from 'express';
import { MailConfig } from './mail.model';
    
interface MailQueueData {
    to: string;
    subject: string;
    templateName: string;
    templateData: any;
    cc?: string[];
    bcc?: string[];
    priority?: number;
    scheduledFor?: Date;
}


/**
 * Middleware to check mail configuration
 */
const checkMailConfig = async (req: Request): Promise<boolean> => {
    try {
        const uid = req.user?._id;
        const mailConfig = await MailConfig.findOne({createdBy : uid});
        
        if (!mailConfig) {
            console.log('Mail configuration not found');
            return false;
        }
        
        if (!mailConfig.isActive) {
            console.log('Mail configuration is not active');
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Error checking mail config:', error);
        return false;
    }
};

export const queueMail = async (
    mailData: MailQueueData,
    userId: string | ObjectId,
    req: Request
) => {
    try {
        // Check mail config first
        const isValidConfig = await checkMailConfig(req);
        if (!isValidConfig) {
            return null;
        }
        // If config is valid, proceed with adding to queue
        return await addToMailQueue(
            mailData.to,
            mailData.subject,
            mailData.templateName,
            mailData.templateData,
            userId.toString(),
            {
                cc: mailData.cc,
                bcc: mailData.bcc,
                priority: mailData.priority || 2, // Default to normal priority
                scheduledFor: mailData.scheduledFor
            }
        );
    } catch (error: any) {
        console.error('Error queuing mail:', error);
        return null;
    }
};

/**
 * Helper function to generate common email templates data
 */
export const EmailTemplates = {
    // Thông báo khi tạo dự án mới
    PROJECT_CREATED: (projectName: string, creatorName: string, link: string) => ({
        templateName: 'projectCreated.template',
        subject: `Dự án mới: ${projectName}`,
        templateData: {
            username: 'Bạn',
            projectName,
            creatorName,
            link,
            message: `Dự án ${projectName} đã được tạo bởi ${creatorName}`
        }
    }),

    // Thông báo khi phê duyệt/kích hoạt dự án
    PROJECT_APPROVE: (projectName: string, username: string, link: string) => ({
        templateName: 'projectApprove.template',
        subject: `Dự án ${projectName} đã được phê duyệt`,
        templateData: {
            username,
            projectName,
            link,
            message: `Dự án ${projectName} đã được phê duyệt và sẵn sàng để bắt đầu`
        }
    }),

    // Thông báo khi thêm tài liệu mới
    DOCUMENT_ADDED: (projectName: string, documentName: string) => ({
        templateName: 'addDocInProject.template',
        subject: `Tài liệu mới trong dự án: ${projectName}`,
        templateData: {
            projectName,
            documentName,
            message: `Tài liệu ${documentName} đã được thêm vào dự án ${projectName}`
        }
    }),

    // Thông báo khi thêm báo cáo mới
    REPORT_ADDED: (projectName: string, reportName: string) => ({
        templateName: 'addReportInProject.template',
        subject: `Báo cáo mới trong dự án: ${projectName}`,
        templateData: {
            projectName,
            reportName,
            message: `Báo cáo ${reportName} đã được thêm vào dự án ${projectName}`
        }
    }),

    // Thông báo khi chuyển phase
    PHASE_CHANGED: (projectName: string, newPhase: string) => ({
        templateName: 'nextPhase.template',
        subject: `Dự án ${projectName} đã chuyển sang giai đoạn mới`,
        templateData: {
            projectName,
            newPhase,
            message: `Dự án ${projectName} đã chuyển sang giai đoạn ${newPhase}`
        }
    }),

    // Thông báo khi dự án kết thúc
    PROJECT_ENDED: (projectName: string) => ({
        templateName: 'endingProject.template',
        subject: `Dự án ${projectName} đã hoàn thành`,
        templateData: {
            projectName,
            message: `Dự án ${projectName} đã hoàn thành`
        }
    }),

    // Thông báo khi có feedback mới
    FEEDBACK_RECEIVED: (projectName: string, rating: number, comment: string) => ({
        templateName: 'Hello.template',
        subject: `Phản hồi mới cho dự án: ${projectName}`,
        templateData: {
            name: projectName,
            message: `Dự án đã nhận được phản hồi mới với đánh giá ${rating}/5 sao.\nNội dung phản hồi: ${comment}`
        }
    }),

    // Thông báo khi tạo tài khoản mới
    ADD_NEW_USER: (username: string, email: string, password: string, link: string) => ({
        templateName: 'addNewUser.template',
        subject: `Tạo tài khoản mới trong hệ thống AKB`,
        templateData: {
            username,
            email,
            password,
            link,
            message: `Chúc mừng! Bạn đã được thêm vào hệ thống AKB.`
        }
    })
}; 
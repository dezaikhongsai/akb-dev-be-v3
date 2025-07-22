import cron from 'node-cron';
import { MailQueue } from '../../../modules/mail/mail.model';
import { sendMailWithTemplate } from '../../../modules/mail/mail.service';
import { createTransporter } from '../../configs';
import { MailConfig } from '../../../modules/mail/mail.model';

const MAX_RETRY = 3;
const BATCH_SIZE = 5; // Giảm batch size để tránh quá tải
const PROCESSING_TIMEOUT = 30000; // 30 giây timeout cho mỗi email

/**
 * Xử lý một email trong queue
 */
const processOneEmail = async (mail: any) => {
    try {
        // Thêm timeout để tránh blocking quá lâu
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Processing timeout')), PROCESSING_TIMEOUT);
        });

        const processingPromise = (async () => {
            // Đánh dấu email đang được xử lý
            await MailQueue.findByIdAndUpdate(mail._id, {
                status: 'processing',
                lastRetryAt: new Date()
            });

            // Lấy mail config của người tạo mail
            const mailConfig = await MailConfig.findOne({ createdBy: mail.createdBy });
            if (!mailConfig) {
                throw new Error('Không tìm thấy cấu hình mail của người gửi');
            }

            // Tạo transporter
            const transporter = createTransporter(mailConfig);

            // Gửi mail
            await sendMailWithTemplate(
                mail.to,
                mail.subject,
                mail.templateName,
                mail.templateData || {},
                mail.createdBy.toString()
            );

            // Cập nhật trạng thái thành công
            await MailQueue.findByIdAndUpdate(mail._id, {
                status: 'success',
                isSend: true,
                sendAt: new Date()
            });

            console.log(`Gửi mail thành công: ${mail._id}`);
        })();

        // Race between timeout and processing
        await Promise.race([timeoutPromise, processingPromise]);
    } catch (error: any) {
        console.error(`Lỗi khi gửi mail ${mail._id}:`, error.message);
        
        // Cập nhật trạng thái thất bại
        await MailQueue.findByIdAndUpdate(mail._id, {
            status: 'failed',
            errorMessage: error.message,
            retryCount: mail.retryCount + 1,
            lastRetryAt: new Date()
        });
    }
};

/**
 * Xử lý batch email trong queue
 */
const processMailQueue = async () => {
    try {
        // Lấy danh sách email cần xử lý
        const pendingMails = await MailQueue.find({
            $or: [
                // Trường hợp 1: Email đang pending và đến giờ gửi
                {
                    status: 'pending',
                    retryCount: { $lt: MAX_RETRY },
                    $or: [
                        { scheduledFor: { $lte: new Date() } },
                        { scheduledFor: { $exists: false } }
                    ]
                },
                // Trường hợp 2: Email bị failed nhưng chưa vượt quá số lần retry
                {
                    status: 'failed',
                    retryCount: { $lt: MAX_RETRY },
                    lastRetryAt: { 
                        $lte: new Date(Date.now() - 5 * 60 * 1000) // Đợi 5 phút trước khi thử lại
                    }
                }
            ]
        })
        .sort({ priority: 1, createdAt: 1 }) // Ưu tiên theo priority và thời gian tạo
        .limit(BATCH_SIZE);

        if (pendingMails.length === 0) {
            return;
        }

        console.log(`Bắt đầu xử lý ${pendingMails.length} email trong queue`);

        // Xử lý từng email
        await Promise.all(pendingMails.map(mail => processOneEmail(mail)));

    } catch (error: any) {
        console.error('Lỗi khi xử lý mail queue:', error.message);
    }
};

/**
 * Dọn dẹp các mail cũ
 */
const cleanupOldMails = async () => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Xóa các mail đã gửi thành công và cũ hơn 30 ngày
        await MailQueue.deleteMany({
            status: 'success',
            sendAt: { $lt: thirtyDaysAgo }
        });

        // Đánh dấu các mail failed quá số lần retry
        await MailQueue.updateMany(
            {
                status: 'failed',
                retryCount: { $gte: MAX_RETRY }
            },
            {
                $set: {
                    status: 'failed',
                    errorMessage: `Đã vượt quá số lần thử lại (${MAX_RETRY})`
                }
            }
        );
    } catch (error: any) {
        console.error('Lỗi khi dọn dẹp mail queue:', error.message);
    }
};

// Cronjob xử lý mail queue (chạy mỗi phút)
export const cronJobProcessMailQueue = () => {
    console.log('Khởi tạo cronjob xử lý mail queue');
    
    // Xử lý mail queue mỗi phút với options để tránh overlap
    cron.schedule('* * * * *', async () => {
        await processMailQueue();
    }, {
        timezone: "Asia/Ho_Chi_Minh"
    });

    // Dọn dẹp mail cũ mỗi ngày lúc 00:00
    cron.schedule('0 0 * * *', async () => {
        await cleanupOldMails();
    }, {
        timezone: "Asia/Ho_Chi_Minh"
    });
};

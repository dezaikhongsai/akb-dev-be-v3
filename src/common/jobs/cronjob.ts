import { cronJobProcessMailQueue } from "./cron/mailQueue";

export const cronJob = () => {
    cronJobProcessMailQueue();
    console.log('Tất cả cronjob đã được khởi tạo');
}

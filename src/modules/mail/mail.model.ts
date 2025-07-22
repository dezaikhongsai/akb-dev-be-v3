import mongoose, { Schema, model } from 'mongoose';
import { IMailConfig } from './dto/mail.type';
import {IMailQueue} from './dto/mail.type';

const mailConfigSchema = new mongoose.Schema<IMailConfig>({
    serviceName : {type : String, required : true },
    host : {type : String, required : true },
    port : {type : Number, required : true },
    encryptMethod : {type : String, required : true , enum : ['SSL', 'TLS']},
    user : {type : String, required : true },
    pass : {type : String, required : true },
    secure : {type : Boolean, required : true },
    senderName : {type : String, required : true },
    createdAt : {type : Date, default : Date.now },
    createdBy : {type : Schema.Types.ObjectId, ref : 'User', required : true , unique : true },
    isActive : {type : Boolean , default : false},
})

const MailConfig = model<IMailConfig>('MailConfig', mailConfigSchema);


const mailQueueSchema = new mongoose.Schema<IMailQueue>({
    to: { type: String, required: true },
    subject: { type: String, required: true },
    templateName: { type: String, required: true },
    templateData: { type: mongoose.Schema.Types.Mixed },
    cc: { type: [String], default: [] },
    bcc: { type: [String], default: [] },
    priority: { type: Number, required: true, default: 2, min: 1, max: 3 }, // 1: cao, 2: trung bình, 3: thấp
    scheduledFor: { type: Date },
    isSend: { type: Boolean, default: false },
    status: { 
        type: String, 
        enum: ['pending', 'processing', 'success', 'failed'], 
        default: 'pending' 
    },
    errorMessage: { type: String, default: '' },
    createdBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    sendAt: { type: Date },
    retryCount: { type: Number, default: 0 },
    lastRetryAt: { type: Date }
});

const MailQueue = model<IMailQueue>('MailQueue', mailQueueSchema);

export {MailConfig , MailQueue};
import mongoose from 'mongoose';
import { IUser } from './dto/user.type';

const userSchema = new mongoose.Schema<IUser>({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'customer', 'pm'],
        default: 'customer'
    },
    alias: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: false
    },
    profile: {
        name: String,
        emailContact: String,
        phoneContact: String,
        companyName: String,
        dob: Date,
        address: String,
        note: String,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model<IUser>('User', userSchema);
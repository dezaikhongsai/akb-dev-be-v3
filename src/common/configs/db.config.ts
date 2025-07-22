import mongoose from 'mongoose'
import {envKey} from './key.config';

export const connectDB= async () => {
  try {
    await mongoose.connect(envKey.db.uri as string , {dbName : envKey.db.name})
    console.log('Connected to MongoDB via Mongoose')
  } catch (err) {
    console.error('MongoDB connection failed:', err)
    process.exit(1)
  }
}
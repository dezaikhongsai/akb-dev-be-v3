import {envKey} from './key.config';
const FE_URL = envKey.fe.url as string;
export const corsOptions = {
  origin: FE_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE' , 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

import express from 'express';
import {connectDB , corsOptions , envKey} from './common/configs';
import cookieParser from "cookie-parser";
import cors from "cors";
import path from 'path';
import * as middleware from 'i18next-http-middleware'
import i18next from './common/locales/i18n';
import {errorHandler} from './common/middlewares';
import userRoute from './modules/user/user.route';
import authRoute from './modules/auth/auth.route';
import projectRoute from './modules/project/project.route';
import systemRoute from './modules/system/system.route';
import phaseRoute from './modules/phase/phase.route';
import documentRoute from './modules/document/document.route';
import mailRoute from './modules/mail/mail.route';
import { cronJob } from './common/jobs/cronjob';
const app = express();

app.use(express.json());
app.use(express.urlencoded({extended : true}));
app.use(cookieParser());

app.use(cors({
  ...corsOptions,
  exposedHeaders: ['Content-Disposition', 'Content-Type'] 
}));

app.use("/uploads", (req, res, next) => {
  res.header('Access-Control-Allow-Origin', envKey.fe.url || '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, "uploads"), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.pdf')) {
      res.set('Content-Type', 'application/pdf');
    }
  }
}));

app.use('/api/:lng/', middleware.handle(i18next));
app.use('/api/:lng/user' , userRoute);
app.use('/api/:lng/auth' , authRoute);
app.use('/api/:lng/project' , projectRoute);
app.use('/api/:lng/system' , systemRoute);
app.use('/api/:lng/phase' , phaseRoute);
app.use('/api/:lng/document' , documentRoute);
app.use('/api/:lng/mail' , mailRoute);

app.use(errorHandler);
connectDB();
cronJob();

const PORT = envKey.app.port;
console.log("FE_URL", envKey.fe.url as string);
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

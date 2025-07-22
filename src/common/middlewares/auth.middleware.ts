import {Request , Response , NextFunction} from 'express';
import jwt from 'jsonwebtoken';
import {ApiError, ApiResponse, HTTP_STATUS} from '../constants';
import {IUserAuth} from '../../modules/auth/dto';
import User from '../../modules/user/user.model';
import {envKey} from '../configs';

declare global {
  namespace Express {
    interface Request {
      user?: IUserAuth;
    }
  }
}
export const verifyToken = async (req : Request , res : Response , next : NextFunction)=>{
    try {
        const token = req.cookies.accessToken;
        if(!token) throw new ApiError(HTTP_STATUS.ERROR.UNAUTHORIZED, req.t('auth.unauthorized', {ns: 'auth'}));
        const decoded = jwt.verify(token , envKey.jwt.access_secret) as {userId : string};
        const validUser = await User.findById(decoded.userId);
        if(!validUser) throw new ApiError(HTTP_STATUS.ERROR.UNAUTHORIZED, req.t('auth.userNotFound', {ns: 'auth'}));
        const user : IUserAuth = {
            _id : validUser._id,
            alias : validUser.alias,
            email : validUser.email,
            role : validUser.role,
            isActive : validUser.isActive as boolean,
            profile : validUser.profile
        }
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(HTTP_STATUS.ERROR.UNAUTHORIZED, req.t('auth.unauthorized', {ns: 'auth'}));
    }
}

export const verifyRefreshToken = async (req : Request , res : Response , next : NextFunction)=>{
    try {
        const refreshToken = req.cookies.refreshToken;
        if(!refreshToken) throw new ApiError(HTTP_STATUS.ERROR.UNAUTHORIZED, req.t('refreshToken.missing', {ns: 'auth'}));
        const decoded = jwt.verify(refreshToken , envKey.jwt.refresh_secret) as {userId : string};
        const validUser = await User.findById(decoded.userId);
        if(!validUser) throw new ApiError(HTTP_STATUS.ERROR.UNAUTHORIZED, req.t('auth.userNotFound', {ns: 'auth'}));
        const user : IUserAuth = {
            _id : validUser._id,
            alias : validUser.alias,
            email : validUser.email,
            role : validUser.role,
            isActive : validUser.isActive as boolean,
            profile : validUser.profile
        }
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(HTTP_STATUS.ERROR.UNAUTHORIZED, req.t('auth.unauthorized', {ns: 'auth'}));
    }
}

export const authorize = (...role : string[]) => {
    return (req : Request , res : Response , next : NextFunction) => {
        const user  = req.user;
        if(!user || !user.role) throw new ApiError(HTTP_STATUS.ERROR.FORBIDDEN, req.t('auth.forbidden', {ns: 'auth'}));
        if(!role.includes(user.role)) throw new ApiError(HTTP_STATUS.ERROR.FORBIDDEN, req.t('auth.forbidden', {ns: 'auth'}));
        next()
    }
}
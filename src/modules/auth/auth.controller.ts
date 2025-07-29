import {
    login,
    refreshToken
} from './auth.service';
import {Request , Response , NextFunction} from 'express';
import { ILogin } from './dto';
import { ApiError, ApiResponse, HTTP_STATUS } from '../../common/constants';

// Cải thiện logic phát hiện môi trường
const isCloud = process.env.IS_CLOUD === 'true' || process.env.NODE_ENV === 'production';
const isHttps = process.env.NODE_ENV === 'production' || process.env.FORCE_HTTPS === 'true';

// Cấu hình cookie linh hoạt hơn
const getCookieOptions = (isSecure: boolean = false) => ({
    httpOnly: true,
    secure: isSecure,
    sameSite: (isSecure ? 'none' : 'lax') as 'none' | 'lax',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000 // 1 day for access token
});

const getRefreshCookieOptions = (isSecure: boolean = false) => ({
    httpOnly: true,
    secure: isSecure,
    sameSite: (isSecure ? 'none' : 'lax') as 'none' | 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days for refresh token
});

export const loginController = async (req : Request , res : Response , next : NextFunction) => {
    try {
        const {email , password} = req.body;
        const loginData : ILogin = {email , password};
        const user = await login(req, loginData); 
        // Set access token cookie với cấu hình linh hoạt
        res.cookie('accessToken', user.accessToken, getCookieOptions(isHttps));

        // Set refresh token cookie với cấu hình linh hoạt
        res.cookie('refreshToken', user.refreshToken, getRefreshCookieOptions(isHttps));

        const response : ApiResponse<typeof user> = {
            status : 'success',
            message : req.t('login.success', {ns: 'auth'}),
            data : user,
        }
        res.status(HTTP_STATUS.SUCCESS.OK).json(response)
    } catch (error) {
        next(error);
    }
}

export const logoutController = async (req : Request , res :  Response , next : NextFunction) => {
    try {
        // Clear refresh token cookie với cùng cấu hình
        res.clearCookie('refreshToken', getRefreshCookieOptions(isHttps));

        // Clear access token cookie với cùng cấu hình
        res.clearCookie('accessToken', getCookieOptions(isHttps));

        const response : ApiResponse<any> = {
            status : 'success',
            message : req.t('logout.success', {ns: 'auth'})
        }
        res.status(HTTP_STATUS.SUCCESS.OK).json(response);
    } catch (error) {
        next(error);
    }
}

export const refreshTokenController = async (req : Request , res : Response , next : NextFunction) => {
    try {
        const user = req.user;
        if(!user || !user._id) throw new ApiError(HTTP_STATUS.ERROR.UNAUTHORIZED, req.t('auth.unauthorized', {ns: 'auth'}));
        const result = await refreshToken(req, user._id.toString());
        
        // Clear old cookies với cùng cấu hình
        res.clearCookie('accessToken', getCookieOptions(isHttps));
        res.clearCookie('refreshToken', getRefreshCookieOptions(isHttps));
        
        // Set new cookies với cùng cấu hình
        res.cookie('accessToken', result.accessToken, getCookieOptions(isHttps));
        res.cookie('refreshToken', result.refreshToken, getRefreshCookieOptions(isHttps));

        const response : ApiResponse<typeof result> = {
            status : 'success',
            message : req.t('refreshToken.success', {ns: 'auth'}),
            data : result
        }
        res.status(HTTP_STATUS.SUCCESS.OK).json(response);
    } catch (error) {
        next(error);
    }
}


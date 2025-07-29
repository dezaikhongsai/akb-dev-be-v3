import {
    login,
    refreshToken
} from './auth.service';
import {Request , Response , NextFunction} from 'express';
import { ILogin } from './dto';
import { ApiError, ApiResponse, HTTP_STATUS } from '../../common/constants';
const isCloud = process.env.IS_CLOUD === 'true'

const cookieOptions = {
    httpOnly: true,
    secure: isCloud, // Always use secure in production
    sameSite: isCloud ? 'strict' : 'none' ,
    path: '/'
};

export const loginController = async (req : Request , res : Response , next : NextFunction) => {
    try {
        const {email , password} = req.body;
        const loginData : ILogin = {email , password};
        const user = await login(req, loginData); 
        
        // Set access token cookie
        res.cookie('accessToken', user.accessToken, {
            httpOnly: true,
            secure: isCloud,
            sameSite: isCloud ? 'strict' : 'none',
            path: '/',
            maxAge:  24 * 60 * 60 * 1000 // 7 days
        });

        // Set refresh token cookie
        res.cookie('refreshToken', user.refreshToken, {
            httpOnly: true,
            secure: isCloud,
            sameSite: isCloud ? 'strict' : 'none',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

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
        // Clear refresh token cookie
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: isCloud,
            sameSite: isCloud?'strict':'none',
            path: '/'
        });

        // Clear access token cookie
        res.clearCookie('accessToken', {
            httpOnly: true,
            secure: isCloud,
            sameSite: isCloud?'strict':'none'
        });

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
        
        // Clear old cookies
        res.clearCookie('accessToken', {
            httpOnly: true,
            secure: isCloud,
            sameSite: isCloud?'strict':'none'
        });
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: isCloud,
            sameSite: isCloud?'strict':'none',
            path: '/'
        });
        
        // Set new cookies
        res.cookie('accessToken', result.accessToken, {
            httpOnly: true,
            secure: isCloud,
            sameSite: isCloud?'strict':'none'
        });
        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: isCloud,
            sameSite: isCloud ? 'strict' : 'none',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

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


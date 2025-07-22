import User from '../user/user.model';
import bcrypt from 'bcryptjs';
import { ILogin } from './dto';
import { ApiError, HTTP_STATUS } from '../../common/constants';
import { genAccessToken, genRefreshToken } from '../../common/utils';
import { Request } from 'express';

export const login = async (req: Request, loginData : ILogin) => {
    try {
        const validateUser = await User.findOne({email : loginData.email});
        if(!validateUser) throw new ApiError(HTTP_STATUS.ERROR.BAD_REQUEST, req.t('login.wrongCredentials', {ns: 'auth'}));
        const isMacth = await bcrypt.compare(loginData.password , validateUser.password );
        if(!isMacth) throw new ApiError(HTTP_STATUS.ERROR.BAD_REQUEST, req.t('login.wrongCredentials', {ns: 'auth'}));
        // if(!validateUser.isActive) throw new ApiError(HTTP_STATUS.ERROR.BAD_REQUEST, req.t('login.inactiveUser', {ns: 'auth'}));
        const accessToken = genAccessToken(validateUser._id.toString());
        const refreshToken = genRefreshToken(validateUser._id.toString());
        const user = {
            _id: validateUser._id,
            email: validateUser.email,
            alias: validateUser.alias,
            role: validateUser.role,
            isActive: validateUser.isActive,
            profile: validateUser.profile
        };
        return{
            user,
            accessToken,
            refreshToken,
        }
    } catch (error : any) {
        throw new ApiError(HTTP_STATUS.SERVER_ERROR.INTERNAL_SERVER , error.message)
    }
}

export const refreshToken = async (req: Request, userId : string) => {
    try {
        const user = await User.findById(userId); 
        if(!user) throw new ApiError(HTTP_STATUS.ERROR.BAD_REQUEST, req.t('auth.userNotFound', {ns: 'auth'}));
        const accessToken = genAccessToken(user._id.toString());
        const refreshToken = genRefreshToken(user._id.toString());
        const userData = {
            _id: user._id,
            email: user.email,
            alias: user.alias,
            role: user.role,
            isActive: user.isActive,
            profile: user.profile
        };
        return {
            user: userData,
            accessToken,
            refreshToken,
        }
    } catch (error : any) {
        throw new ApiError(HTTP_STATUS.SERVER_ERROR.INTERNAL_SERVER, error.message)
    }
}
import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import type { StringValue } from "ms";
import {envKey} from '../configs';

export const genAccessToken = (userId: string): string => {
    const payload = { userId };
    const expiresIn = (envKey.jwt.access_expire) as StringValue;
    const options: SignOptions = {
        expiresIn, 
    };
    const secret: Secret = envKey.jwt.access_secret;
    return jwt.sign(payload, secret, options);
};

export const genRefreshToken = (userId: string): string => {
    const payload = { userId };
    const expiresIn = (envKey.jwt.refresh_expire) as StringValue;
    const options: SignOptions = {
        expiresIn, 
    };
    const secret: Secret = envKey.jwt.refresh_secret;
    return jwt.sign(payload, secret, options);
}
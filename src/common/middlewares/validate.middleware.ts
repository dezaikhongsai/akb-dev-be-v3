import {Request , Response , NextFunction} from 'express';
import {ObjectSchema} from 'joi';
import { ApiError , HTTP_STATUS} from '../constants';

export const validateRequest = (schema : ObjectSchema) => {
    return (req : Request , res : Response , next : NextFunction) => {
        const {error} = schema.validate(req.body , {abortEarly : true});
        if(error){
            const message = error.details.map((d) => d.message);
            return next(new ApiError(HTTP_STATUS.ERROR.BAD_REQUEST, message[0]));
        }
        next();
    }
}
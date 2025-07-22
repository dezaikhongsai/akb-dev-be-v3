import { ApiError , HTTP_STATUS } from '../../common/constants';
import { genAlias } from '../../common/utils';
import {ICreateUser, IUpdateUser} from './dto';
import User from './user.model';
import bcrypt from 'bcryptjs';
import { Request } from 'express';

export const createUser = async (req : Request , userData:ICreateUser) => {
    try {
        const {password, ...userInfor} = userData;
        const exsitUser = await User.findOne({email : userInfor.email})
        if(exsitUser) throw new ApiError(HTTP_STATUS.ERROR.BAD_REQUEST, req.t('createUser.exists', {ns: 'user'}));
        const usersWithSameRole = await User.find({ role: userInfor.role }, 'alias');
        const existingAlias = usersWithSameRole.map(u => u.alias);
        const generatedAlias = genAlias(userInfor.role, existingAlias);
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword =  await bcrypt.hash(password , salt);
        const user : ICreateUser = {
            email : userInfor.email,
            password : hashedPassword,
            alias : generatedAlias,
            role : userInfor.role,
            isActive : userInfor.profile ? true : false,
            profile : userInfor.profile,
            createdBy: userInfor.createdBy,
            updatedBy: userInfor.updatedBy,
            createdAt : new Date(),
            updatedAt : new Date(),
        }
        const newUser = await User.create(user);
        if(!newUser) throw new ApiError(HTTP_STATUS.ERROR.BAD_REQUEST, req.t('createUser.error', {ns: 'user'}));
        return newUser;
    } catch (error : any) {
        throw new ApiError(HTTP_STATUS.SERVER_ERROR.INTERNAL_SERVER, error.message);
    }
}

export const getUserPagination = async (req: Request, limit : number = 10 , page : number = 1 , search : string = '' , role : 'admin' | 'customer' | 'pm' , sort : 'asc' | 'desc' = 'asc' , isActive? : string) => {
    try {
        const skip = (page - 1) * limit;
        let searchQuery : any = {};
        
        if (search) {
            searchQuery.$or = [
                { email: { $regex: search, $options: 'i' } },
                { alias: { $regex: search, $options: 'i' } },
                { 'profile.name': { $regex: search, $options: 'i' } }
            ];
        }
        
        if (role) {
            searchQuery.role = role;
        }
        
        if (isActive === 'true' || isActive === 'false') {
            searchQuery.isActive = isActive === 'true';
        }
        
        const total = await User.countDocuments(searchQuery);
        const users = await User.find(searchQuery)
            .collation({ locale: 'en_US', numericOrdering: true })
            .sort({ alias: sort === 'asc' ? 1 : -1 })
            .skip(skip)
            .limit(limit)
            .select('-password')
            .populate('createdBy', 'email profile.name')
            .populate('updatedBy', 'email profile.name');

        return {
            users,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    } catch (error : any) {
        throw new ApiError(HTTP_STATUS.SERVER_ERROR.INTERNAL_SERVER, error.message);
    }
}

export const updateUser = async (req : Request , userId : string , userData : IUpdateUser) => {
    try {
        const userRole = req.user?.role;
        const id = req.user?._id.toString();
        if(userRole === 'customer' && id !== userId) throw new ApiError(HTTP_STATUS.ERROR.FORBIDDEN, req.t('updateUser.noPermission', {ns: 'user'}));
        const user = await User.findByIdAndUpdate(userId , userData , {new : true})
        if(!user) throw new ApiError(HTTP_STATUS.ERROR.NOT_FOUND, req.t('updateUser.notFound', {ns: 'user'}));
        return user;
    } catch (error : any) {
        throw new ApiError(HTTP_STATUS.SERVER_ERROR.INTERNAL_SERVER, error.message);
    }
}

export const deleteUser = async (req: Request, userId : string) => {
    try {
        const user = await User.findByIdAndDelete(userId);
        if(!user) throw new ApiError(HTTP_STATUS.ERROR.NOT_FOUND, req.t('deleteUser.notFound', {ns: 'user'}));
        return user;
    } catch (error : any) {
        throw new ApiError(HTTP_STATUS.SERVER_ERROR.INTERNAL_SERVER, error.message);
    }
}
export const me = async (req: Request) => {
    try {
        const userId = req.user?._id.toString();
        const user = await User.findById(userId)
            .select('-password')
            .populate('createdBy', 'email profile.name')
            .populate('updatedBy', 'email profile.name');
        if(!user) throw new ApiError(HTTP_STATUS.ERROR.NOT_FOUND, req.t('me.notFound', {ns: 'user'}));
        return user;
    } catch (error : any) {
        throw new ApiError(HTTP_STATUS.SERVER_ERROR.INTERNAL_SERVER, error.message);
    }
}

export const statisticUser = async () => {
    try {
        const totalUser = await User.countDocuments();
        const totalActiveUser = await User.countDocuments({isActive : true});
        const totalInactiveUser = totalUser - totalActiveUser;
        const totalAdmin = await User.countDocuments({role : 'admin' , isActive : true});
        const totalCustomer = await User.countDocuments({role : 'customer' , isActive : true});
        const totalPM = await User.countDocuments({role : 'pm' , isActive : true});
        const calculatePercent = (value: number) => {
            if (totalUser === 0) return 0;
            return Number(((value / totalUser) * 100).toFixed(2));
        };

        return {
            totalUser,
            totalActiveUser,
            totalInactiveUser,
            totalAdmin,
            totalCustomer,
            totalPM,
            percentActiveUser: calculatePercent(totalActiveUser),
            percentInactiveUser: calculatePercent(totalInactiveUser),
            percentAdmin: calculatePercent(totalAdmin),
            percentCustomer: calculatePercent(totalCustomer),
            percentPM: calculatePercent(totalPM)
        }
    } catch (error : any) {
        throw new ApiError(HTTP_STATUS.SERVER_ERROR.INTERNAL_SERVER, error.message);
    }
}

export const autoSearchUser = async (req: Request, search: string = '', roles: ('admin' | 'customer' | 'pm')[] = ['admin', 'customer', 'pm'], limit: number = 10) => {
    try {
        if (!search.trim()) {
            return [];
        }

        const searchRegex = new RegExp(search, 'i');
        const users = await User.find({
            $and: [
                {
                    $or: [
                        { alias: { $regex: searchRegex } },
                        { email: { $regex: searchRegex } },
                        { 'profile.name': { $regex: searchRegex } },
                        { 'profile.phoneContact': { $regex: searchRegex } },
                        { 'profile.emailContact': { $regex: searchRegex } },
                        { 'profile.companyName': { $regex: searchRegex } }
                    ]
                },
                { role: { $in: roles } },
                { isActive: true }
            ]
        })
        .select('alias email role profile createdAt')
        .populate('createdBy', 'email profile.name')
        .sort({ createdAt: -1 })
        .limit(limit);

        return users.map(user => ({
            _id: user._id,
            alias: user.alias,
            email: user.email,
            role: user.role,
            profile: user.profile ? {
                name: user.profile.name,
                emailContact: user.profile.emailContact,
                phoneContact: user.profile.phoneContact,
                companyName: user.profile.companyName
            } : null,
            createdBy: user.createdBy
        }));
    } catch (error: any) {
        throw new ApiError(HTTP_STATUS.SERVER_ERROR.INTERNAL_SERVER, error.message);
    }
}
// còn một ý thông kê khách hàng trong dự án , feedback , ... ta sẽ làm ở phần sau

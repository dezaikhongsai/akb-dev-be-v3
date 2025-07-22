import mongoose from 'mongoose';
import { IPhase } from './dto';

const phaseSchema = new mongoose.Schema<IPhase>({
    projectId : {type : mongoose.Schema.Types.ObjectId, ref : 'Project', required : true},
    name : {type : String, required : true},
    description : {type : String, required : false},
    startDate : {type : Date, required : true},
    createdBy : {type : mongoose.Schema.Types.ObjectId, ref : 'User', required : false},
    updatedBy : {type : mongoose.Schema.Types.ObjectId, ref : 'User', required : false},
}, {timestamps : true})

const Phase = mongoose.model<IPhase>('Phase', phaseSchema);

export default Phase;
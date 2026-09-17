import { AppError } from "../../errors/appError.js";
import Lodash from "lodash";

function esNil (arg, error){
    if(Lodash.isNil(arg)){
        throw new AppError(error, 400);
    }
}

function esEmpty (arg, error){
    if(Lodash.isEmpty(arg)){
        throw new AppError(error, 400);
    }
}


export default {esNil, esEmpty};
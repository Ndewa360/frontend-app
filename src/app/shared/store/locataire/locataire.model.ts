import { UserModel } from "../user/user.model";

export interface LocataireModel extends UserModel {
    room: string;
    property:string;
    description?:string;
    fullNameRef?:string;
    phoneNumberRef?:string;
    emailRef?:string;
}
import { UserModel } from "./user.model";
export namespace UserAction
{
    //Create
    export class UpdateUser
    {
        static readonly type = '[User] Update User';
        constructor(public user:UserModel, public id:string){}
    }

    //Fetch  User profil
    export class FetchUser
    {
        static readonly type = '[User] Fectch User'
        constructor(public userId:string){}
    }

    //Fetch  User profil
    export class FetchUsers
    {
        static readonly type = '[User] Fectch Users'
        constructor(public usersId:string[]=[]){}
    }

    //Login Action
    export class LoginUser
    {
        static readonly type = '[User] Login User'
        constructor(public email:string,public password:string){}
    }

    //Sigup User Action
    export class SignupSimpleUser
    {
        static readonly type = '[User] Signup simple User'
        constructor(public email:string,public password:string,public username:string){}
    }

    //Sigup User Action
    export class SignupDoctorUser
    {
        static readonly type = '[User] Siggnup doctor User'
        constructor(public email:string,public password:string){}
    }

    //Set user profil
    export class SetUser
    {
        static readonly type = '[User] Set User'
        constructor(public user:any){}
    }

    //Login Action
    export class LogoutUser
    {
        static readonly type = '[User] Logout User'
        constructor(public status:boolean){}
    }

    //Change loading state
    export class updateLoadingUserState
    {
        static readonly type = '[User] Loading state User'
        constructor(public status:boolean){}
    }
}

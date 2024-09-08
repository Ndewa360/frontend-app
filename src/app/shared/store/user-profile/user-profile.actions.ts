import { UserProfileModel } from "./user-profile.model";
export namespace UserProfileAction
{
    //Create
    export class UpdateUserProfile
    {
        static readonly type = '[UserProfile] Update UserProfile';
        constructor(public userProfile:UserProfileModel, public id:string){}
    }

    //Fetch  User profil
    export class FetchUserProfile
    {
        static readonly type = '[UserProfile] Fectch UserProfile'
        constructor(){}
    }

    //Login Action
    export class LoginUserProfile
    {
        static readonly type = '[UserProfile] Login UserProfile'
        constructor(public email:string,public password:string){}
    }

     //Forgot Action
     export class ForgotPasswordUserProfile
     {
         static readonly type = '[UserProfile] ForgetPassword UserProfile'
         constructor(public email:string){}
     }

    //Sigup User Action
    export class SignupSimpleUserProfile
    {
        static readonly type = '[UserProfile] Signup simple UserProfile'
        constructor(public email:string,public password:string,public username:string){}
    }


    //Set user profil
    export class SetUserProfile
    {
        static readonly type = '[UserProfile] Set UserProfile'
        constructor(public user:any){}
    }

    //Login Action
    export class LogoutUserProfile
    {
        static readonly type = '[UserProfile] Logout UserProfile'
        constructor(public status:boolean){}
    }

    //Change loading state
    export class updateLoadingUserProfileState
    {
        static readonly type = '[UserProfile] Loading state UserProfile'
        constructor(public status:boolean){}
    }
}

export interface ApiResultFormat<T>{
    statusCode:number,
    message?:string,
    data:T
}
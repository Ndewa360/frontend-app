export class FormUtils
{
    static removeNullAttribut(obj){
        Object.keys(obj).forEach(key => {
            if (!obj[key]) {
              delete obj[key];
            }
        });
        return obj
    }
}
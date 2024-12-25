export class FormUtils
{
    static removeNullAttribut(obj){
        Object.keys(obj).forEach(key => {
            if (obj[key]==null || obj[key]==undefined) {
              delete obj[key];
            }
        });
        return obj
    }
}
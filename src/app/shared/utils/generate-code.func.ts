import { RoomType } from "./../../rooms/enums";


export class GenerateCodeUtil
{
    static generateBillingRef()
    {
        
        return `NDEWA360_${GenerateCodeUtil.generateRandomCode()}`
    }
    
    static generatePropertyCode()
    {
        return `PROP_${GenerateCodeUtil.generateRandomCode()}`
    }

    static generateCode(type:RoomType)
    {
        let code:string="";
        switch(type)
        {
            case RoomType.STUDIO:
                code="STUDIO";
                break;
            case RoomType.ROOM:
                code="ROOM";
                break;
            case RoomType.SIMPLE_APARTMENT:
                code="SAPPART";
                break;
            case RoomType.FURNISHED_APARTMENT:
                code="MAPPART";
                break;
        }
        return `${type}_${GenerateCodeUtil.generateRandomCode()}`
    }
    static generateRandomCodeWithLength(size)
    {
        let strCode="";
        for(let i =0; i<size; i++)  strCode+=this.generateRandomCode();
        return strCode;
    }
    static generateRandomCode()
    {
        let alpha="ABCDEFGHIJKLMNOPQRSTUVWXY2";
        let numAlpha="0123456789"
        return `${alpha[GenerateCodeUtil.generateRandomSpecificNumber(alpha.length)]}${numAlpha[GenerateCodeUtil.generateRandomSpecificNumber(numAlpha.length)]}${numAlpha[GenerateCodeUtil.generateRandomSpecificNumber(numAlpha.length)]}`
    }
    static generateRandomSpecificNumber(length:number)
    {
        return Math.floor(Math.random()*100)%length
    }

    static generateRandomBillingCode(){
        return Array.from(Array(12), (_, i) => Math.floor(Math.random()*10)%10).reduce((acc,curr)=>`${acc}${curr}`,"")
    }
}
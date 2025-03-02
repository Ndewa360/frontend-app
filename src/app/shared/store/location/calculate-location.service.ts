import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Store } from "@ngxs/store";
import { RoomState } from "../rooms";
import { LocationState } from "./location.state";

@Injectable({
    providedIn:'root'
})
export class CalculateLocationService
{
    /**
     * Constructor
     */
    constructor(
        private _httpClient: HttpClient,
        private _store:Store
    )
    {}

    initCalculateLocation(locataireInfos: { locataire?: any; room?: any; entryDate?: Date; }) 
    {            
        let dateNow = new Date();
        let dateEntry = new Date(locataireInfos.entryDate);
        //console.log("locataire ",dateNow,locataireInfos.entryDate)

        if(dateEntry.getMonth() > dateNow.getMonth()) return [];
        // let room = await this._store.select(RoomState.selectStateRoom(locataireInfos.room)).toPromise(),
        //     locataire  = await this._store.select(LocationState.selectStateLocation(locataireInfos.locataire)).toPromise(),
        let dataLocation=[];

        while(dateEntry.getMonth()<dateNow.getMonth())
        {
            // //console.log("dateEntry ", dateEntry, dateNow.getMonth(), dateEntry.getMonth(), dateNow.getMonth()>dateEntry.getMonth())
            
            dataLocation.push({
                isPaid:false,
                month:dateNow.getMonth(),
                year:dateNow.getFullYear(),
                day:dateNow.getDate()
            })
            dateEntry.setMonth(dateEntry.getMonth()+1);
        }

        return dataLocation;
    }

}
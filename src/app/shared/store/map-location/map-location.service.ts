import { Injectable } from "@angular/core";
import { MapLocationModel } from "./map-location.model";

@Injectable({
    providedIn: 'root'
})
export class MapLocationService{
    getCordFromLocation():Promise<MapLocationModel>
    {
        return new Promise((resolve, reject) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        zoom: 12
                    });
                });
            } else {
                reject("Geolocation is not supported by this browser.");
            }
        });
    }
}
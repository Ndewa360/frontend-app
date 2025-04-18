import {Injectable} from '@angular/core'
import { Platform } from '@ionic/angular';

export enum PLATEFORM_TYPE {
  DESKTOP="desktop",
  MOBILE="mobile",
  TABLET="tablet"
}

@Injectable({
  providedIn: 'root'
})
export class PlateformService {
  isMobileApp = false;
  isBrowser = false;

  constructor(public platform: Platform) { 
    this.setPlatformType()
  }

  private setPlatformType()
  {
      this.platform.ready().then(() => {
        this.isMobileApp = this.platform.is('cordova') || this.platform.is('capacitor');
        this.isBrowser = this.platform.is('desktop') || this.platform.is('mobileweb');
      });
  }

  getPlateformType():PLATEFORM_TYPE
  {
    if(this.isMobileApp)
    {
      return PLATEFORM_TYPE.MOBILE
    }
    else if(this.isBrowser)
    {
      return PLATEFORM_TYPE.DESKTOP
    }
    else
    {
      return PLATEFORM_TYPE.TABLET
    }
  }
}

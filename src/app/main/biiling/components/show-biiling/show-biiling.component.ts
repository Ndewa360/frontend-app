import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Select, Store } from '@ngxs/store';
import {jsPDF} from 'jspdf';
import html2canvas from 'html2canvas';
import { Observable } from 'rxjs';
import { LocataireModel, LocataireState, RoomAction, RoomModel, RoomState, UserProfileModel, UserProfileState } from 'src/app/shared/store';
import { LocationPaymentModel, LocationPaymentState } from 'src/app/shared/store/payment-location';
import { UtilsString } from 'src/app/shared/utils';
import { NgxPrintService, PrintOptions } from 'ngx-print';

@Component({
  selector: 'show-biiling',
  templateUrl: './show-biiling.component.html',
  styleUrls: ['./show-biiling.component.css'],
  encapsulation:ViewEncapsulation.None
})
export class ShowBiilingComponent implements OnInit{
  locationPayment:LocationPaymentModel | any=null;
  @Select(UserProfileState.selectStateUserProfile) connectedUser$:Observable<UserProfileModel>
  locataire$:Observable<LocataireModel>
  room$:Observable<RoomModel>;

  roomTypeTitle=""
  constructor(
    private _store:Store,
    private printService: NgxPrintService,
    private _activatedRoute: ActivatedRoute,
  ) { }


  ngOnInit(): void {
    let locataireID = this._activatedRoute.snapshot.paramMap.get('locataireID'),
        billingID = this._activatedRoute.snapshot.paramMap.get('billingID');

    this.locataire$=this._store.select(LocataireState.selectStateLocataire(locataireID));
    this._store.select(LocationPaymentState.selectStateLocationPaymentByBillingRef(billingID)).subscribe((data:LocationPaymentModel)=>{
      if(!data) return;
      this._store.dispatch(new RoomAction.FetchRoom(data.room))
      this.locationPayment={
        ...data,
        datePayment:new Date(data.datePayment),
        createdAt:new Date(),
        description: UtilsString.getStringOfLocationPaymentType(data.paymentLocationType)
      };
      this.room$=this._store.select(RoomState.selectStateRoom(data.room));
      this.room$.subscribe((value)=>{
        if(value) this.roomTypeTitle=UtilsString.getStringOfRoomType(value.type);
      })
    })  
  }

  generatePDF()
    {
      const customPrintOptions: PrintOptions = new PrintOptions({
        printSectionId: 'print-section',
        useExistingCss:true
        // Add any other print options as needed
    });
    this.printService.print(customPrintOptions)
    }

    getCurrentYear()
    {
      return new Date().getFullYear()
    }
}

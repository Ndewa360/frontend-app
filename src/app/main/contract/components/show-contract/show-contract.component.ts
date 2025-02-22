import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';
import { Select, Store } from '@ngxs/store';
import { NgxPrintService, PrintOptions } from 'ngx-print';
import { combineLatest, Observable } from 'rxjs';

import { LocationPaymentModel, UserProfileState, UserProfileModel, LocataireModel, RoomModel, LocataireState, LocationPaymentState, RoomAction, RoomState, ContractState } from 'src/app/shared/store';
import { UtilsString } from 'src/app/shared/utils';

@Component({
  selector: 'show-contract',
  templateUrl: './show-contract.component.html',
  styleUrls: ['./show-contract.component.css'],
  // encapsulation: ViewEncapsulation.None
})
export class ShowContractComponent implements OnInit{
  locationPayment:LocationPaymentModel | any=null;
  @Select(UserProfileState.selectStateUserProfile) connectedUser$:Observable<UserProfileModel>
  @Select(ContractState.selectStateLoading) loadingPDF$:Observable<boolean>
  
  pdfSrc="https://storage.googleapis.com/visuel_biens/contract_models/modele_contract.pdf"

  roomTypeTitle=""
  locataire = null;
  loading=true;
  titlePage=""
  retourPathLink=""

  constructor(
    private _store:Store,
    private printService: NgxPrintService,
    private _activatedRoute: ActivatedRoute,
  ) { }


  ngOnInit(): void {
    let locationId = this._activatedRoute.snapshot.paramMap.get("locationID");
    let contractLocataire$ = this._store.select(ContractState.selectStateContractByLocationId(locationId))
    
    contractLocataire$.subscribe((result)=>{
      if(result){
        // const fileURL = URL.createObjectURL();
        this.pdfSrc = `data:application/pdf;base64,${result.pdf}`;
      }
    })

    let locataireLoading$ = this._store.select(LocataireState.selectStateLocataire(this._activatedRoute.snapshot.params['locataireID']));
    locataireLoading$.subscribe((result)=>{
      this.locataire = result

    })

    combineLatest(contractLocataire$, locataireLoading$, this.loadingPDF$).subscribe(([contractLocataire,locataireLoading,loadingPDF])=>{
      console.log(loadingPDF, locataireLoading, contractLocataire)
      this.loading = loadingPDF && locataireLoading && contractLocataire
      if(this.loading) {
        this.titlePage = `Contrat de ${locataireLoading.fullName}`
        this.retourPathLink = `/app/locataires/${locataireLoading._id}`}
     
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

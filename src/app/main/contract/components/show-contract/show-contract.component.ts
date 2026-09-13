import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';
import { Select, Store } from '@ngxs/store';
import { NgxPrintService, PrintOptions } from 'ngx-print';
import { combineLatest, Observable } from 'rxjs';

import { LocationPaymentModel, UserProfileState, UserProfileModel, LocataireModel, RoomModel, LocataireState, LocationPaymentState, RoomAction, RoomState, ContractState, LocationModel } from 'src/app/shared/store';
import { UtilsString } from 'src/app/shared/utils';
import { AppLoaderComponent } from '../../../../../@youpez/components/app-loader/app-loader.component';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { NgIf } from '@angular/common';
import { IbmIconComponent } from '../../../../../@youpez/components/ibm-icon/ibm-icon.component';
import { ButtonModule } from 'carbon-components-angular/button';
import { FlexModule } from '@angular/flex-layout/flex';

@Component({
  selector: 'show-contract',
  templateUrl: './show-contract.component.html',
  styleUrls: ['./show-contract.component.css'],
  standalone: true,
  imports: [
    FlexModule,
    ButtonModule,
    IbmIconComponent,
    NgIf,
    NgxExtendedPdfViewerModule,
    AppLoaderComponent
  ]
})
export class ShowContractComponent implements OnInit{
  locationPayment:LocationPaymentModel | any=null;
  @Select(UserProfileState.selectStateUserProfile) connectedUser$:Observable<UserProfileModel>;
  @Select(ContractState.selectStateLoading) loadingPDF$:Observable<boolean>;
  
  pdfSrc='https://storage.googleapis.com/visuel_biens/contract_models/modele_contract.pdf';

  roomTypeTitle='';
  locataire = null;
  loading=true;
  titlePage='';
  retourPathLink='';

  constructor(
    private _store:Store,
    private printService: NgxPrintService,
    private _activatedRoute: ActivatedRoute,
    @Inject(MAT_DIALOG_DATA) public data:{location:LocationModel},
    private dialogRef: MatDialogRef<ShowContractComponent>
    
  ) { }


  ngOnInit(): void {
    const contractLocataire$ = this._store.select(ContractState.selectStateContractByLocationId(this.data.location._id));
    
    contractLocataire$.subscribe((result) => {
      if(result){
      
        // const fileURL = URL.createObjectURL();
        this.pdfSrc = `data:application/pdf;base64,${result.pdf}`;
      }
    });

    const locataireLoading$ = this._store.select(LocataireState.selectStateLocataire(this.data.location.locataire));
    locataireLoading$.subscribe((result) => {
      this.locataire = result;

    });

    combineLatest([contractLocataire$, locataireLoading$, this.loadingPDF$]).subscribe(([contractLocataire,locataireLoading,loadingPDF]) => {
      this.loading = loadingPDF && locataireLoading && contractLocataire;
      if(this.loading) {
        this.titlePage = `Contrat de ${locataireLoading.fullName}`;
        this.retourPathLink = `/app/locataires/${locataireLoading._id}`;}
     
    });
  }

  generatePDF()
  {
    const customPrintOptions: PrintOptions = new PrintOptions({
      printSectionId: 'print-section',
      useExistingCss:true
      // Add any other print options as needed
    });
    this.printService.print(customPrintOptions);
  }


  getCurrentYear()
  {
    return new Date().getFullYear();
  }
  onClose() {
    this.dialogRef.close(false);
  }
}

import { Component, Inject, ViewEncapsulation, OnInit, Input, Output, EventEmitter, Optional } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store, Actions, ofActionSuccessful, ofActionCompleted, ofActionErrored } from '@ngxs/store';
import { Observable } from 'rxjs';
import { RemoveLocataireRoomComponent } from 'src/app/main/properties/components/remove-locataire-room/remove-locataire-room.component';
import { LocataireModel, LocataireState, LocationModel, RoomModel, RoomState } from 'src/app/shared/store';
import { LocationPaymentAction, LocationPaymentType } from 'src/app/shared/store/payment-location';
import { UtilsString, FormUtils } from 'src/app/shared/utils';

@Component({
  selector: 'app-add-payment',
  templateUrl: './add-payment.component.html',
  styleUrls: ['./add-payment.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class AddPaymentComponent implements OnInit {
  // Inputs pour utilisation en tant que composant réutilisable
  @Input() room: RoomModel | null = null;
  @Input() tenant: LocataireModel | null = null;
  @Input() location: LocationModel | null = null;
  @Output() paymentAdded = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  public formGroup: FormGroup;
  layout: string = 'horizontal';
  theme: string = 'light';
  locataire$: Observable<LocataireModel> | null = null;
  room$: Observable<RoomModel> | null = null;

  paymentTypeList: any[] = [];
  waittingResponse = false;

  constructor(
    @Optional() private dialogRef: MatDialogRef<RemoveLocataireRoomComponent>,
    protected formBuilder: FormBuilder,
    private _store: Store,
    private _ngxsAction: Actions,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: {location: LocationModel} | null
  ) { }

  ngOnInit(): void {
    this.formGroup = this.formBuilder.group({
      paymentLocationType: [LocationPaymentType.LOCATION, [Validators.required]],
      locationPaymentPrice: [5000, [Validators.required, Validators.min(1000)]],
      datePayment: [null, [Validators.required]],
      reason: [null]
    });

    this.paymentTypeList = Object.values(LocationPaymentType).map((value) => ({
      content: UtilsString.getStringOfLocationPaymentType(value),
      valueType: value,
      selected: value == LocationPaymentType.LOCATION
    }));

    // Utiliser les inputs si disponibles, sinon utiliser les données du dialog
    if (this.location) {
      this.locataire$ = this._store.select(LocataireState.selectStateLocataire(this.location.locataire));
      this.room$ = this._store.select(RoomState.selectStateRoom(this.location.room));
    } else if (this.data?.location) {
      this.locataire$ = this._store.select(LocataireState.selectStateLocataire(this.data.location.locataire));
      this.room$ = this._store.select(RoomState.selectStateRoom(this.data.location.room));
    }

    this._ngxsAction.pipe(ofActionSuccessful(LocationPaymentAction.CreateLocationPayment)).subscribe((action) => {
      this.waittingResponse = false;
      this.paymentAdded.emit(action);
      this.onClose();
    });

    this._ngxsAction.pipe(ofActionCompleted(LocationPaymentAction.CreateLocationPayment)).subscribe(() => {
      this.waittingResponse = false;
    });

    this._ngxsAction.pipe(ofActionErrored(LocationPaymentAction.CreateLocationPayment)).subscribe(() => {
      this.waittingResponse = false;
    });
  }

  onClose() {
    this.formGroup.reset();
    this.cancel.emit();

    // Fermer le dialog si utilisé en modal
    if (this.dialogRef) {
      this.dialogRef.close(false);
    }
  }

  isValid(name: string): boolean {
    const instance = this.formGroup.get(name);
    return instance ? instance.invalid && (instance.dirty || instance.touched) : false;
  }

  onSubmit() {
    this.formGroup.markAllAsTouched();
    if (this.formGroup.invalid) return;

    let bodyToSend = FormUtils.removeNullAttribut({...this.formGroup.value});
    this.waittingResponse = true;
    let datePayment = bodyToSend.datePayment[0];
    datePayment.setHours(6);

    // Utiliser la location appropriée
    const targetLocation = this.location || this.data?.location;

    if (!targetLocation) {
      console.error('Aucune location disponible pour créer le paiement');
      this.waittingResponse = false;
      return;
    }

    this._store.dispatch(new LocationPaymentAction.CreateLocationPayment({
      ...bodyToSend,
      datePayment: datePayment.toISOString().split("T")[0],
      locataireId: targetLocation.locataire,
      locationId: targetLocation._id,
      roomId: targetLocation.room,
      propertyId: targetLocation.property
    }));
  }

  getRowLayout(num: number): string {
    if (this.layout === 'vertical') {
      return '100%';
    }
    return num + '%';
  }

  onSelectedType(payementType: any): void {
    this.formGroup.get('paymentLocationType')?.setValue(payementType.valueType);
  }

  getMoney(): string {
    return UtilsString.getDefaultCurrency();
  }
}

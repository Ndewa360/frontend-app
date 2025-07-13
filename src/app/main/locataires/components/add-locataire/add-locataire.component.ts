import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Store, Actions, ofActionSuccessful, ofActionErrored } from '@ngxs/store';
import { LocataireAction, PropertyModel } from 'src/app/shared/store';
import { BaseComponent } from 'src/app/shared/utils/base-component';
import { phoneValidator } from 'src/app/shared/validators/phone-validator';
import { takeUntil } from 'rxjs/operators';

export interface AddLocataireData {
  property?: PropertyModel;
  propertyId?: string;
}

@Component({
  selector: 'app-add-locataire',
  templateUrl: './add-locataire.component.html',
  styleUrls: ['./add-locataire.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AddLocataireComponent extends BaseComponent implements OnInit {

  public formGroup: FormGroup;
  waittingResponse = false;

  constructor(
    private dialogRef: MatDialogRef<AddLocataireComponent>,
    protected formBuilder: FormBuilder,
    private _store: Store,
    @Inject(MAT_DIALOG_DATA) public data: AddLocataireData,
    private _ngxsAction: Actions
  ) {
    super();
  }

  ngOnInit(): void {
    this.initForm();
    this.setupActionListeners();
  }

  private initForm(): void {
    this.formGroup = this.formBuilder.group({
      fullName: [null, [Validators.required]],
      email: [null, [Validators.email]],
      phone: [null, [phoneValidator()]],
      address: [null],
      profession: [null],
      emergencyContact: [null],
      emergencyPhone: [null, [phoneValidator()]],
      notes: [null]
    });
  }

  private setupActionListeners(): void {
    // Succès de création
    this._ngxsAction.pipe(
      ofActionSuccessful(LocataireAction.CreateLocataire),
      takeUntil(this.destroy$)
    ).subscribe((result) => {
      this.waittingResponse = false;
      this.dialogRef.close(result);
    });

    // Erreur de création
    this._ngxsAction.pipe(
      ofActionErrored(LocataireAction.CreateLocataire),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.waittingResponse = false;
    });
  }

  onSubmit(): void {
    if (this.formGroup.valid && !this.waittingResponse) {
      this.waittingResponse = true;
      
      const formData = this.formGroup.value;
      const locataireData = {
        ...formData,
        property: this.data.propertyId || this.data.property?._id
      };

      this._store.dispatch(new LocataireAction.CreateLocataire(locataireData));
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  // Getters pour faciliter l'accès aux contrôles du formulaire
  get fullName() { return this.formGroup.get('fullName'); }
  get email() { return this.formGroup.get('email'); }
  get phone() { return this.formGroup.get('phone'); }
  get address() { return this.formGroup.get('address'); }
  get profession() { return this.formGroup.get('profession'); }
  get emergencyContact() { return this.formGroup.get('emergencyContact'); }
  get emergencyPhone() { return this.formGroup.get('emergencyPhone'); }
  get notes() { return this.formGroup.get('notes'); }
}

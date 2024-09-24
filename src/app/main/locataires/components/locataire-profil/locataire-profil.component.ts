import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store, Actions, ofActionCompleted, ofActionErrored, ofActionSuccessful } from '@ngxs/store';
import { LocataireAction, LocataireModel, LocataireState } from 'src/app/shared/store';
import { FormUtils } from 'src/app/shared/utils';

@Component({
  selector: 'locataire-profil',
  templateUrl: './locataire-profil.component.html',
  styleUrls: ['./locataire-profil.component.css']
})
export class LocataireProfilComponent implements OnInit{
  public formGroup: FormGroup;
  waittingResponse = false;
  title = 'Locataire'
  locataire:LocataireModel=null;

  constructor(
    protected formBuilder: FormBuilder,
    private _store:Store,
    private _ngxsAction:Actions,
    private _activatedRoute: ActivatedRoute,
) { }

  ngOnInit(): void {
    let locataireID = this._activatedRoute.snapshot.parent.paramMap.get('locataireID');
    this._store.select(LocataireState.selectStateLocataire(locataireID)).subscribe((locataire)=>{
      this.locataire = locataire;
    });

    this.formGroup = this.formBuilder.group({
      fullName:[this.locataire?.fullName,[Validators.required]],
      email: [this.locataire?.email, [Validators.email]],
      phoneNumber:[this.locataire?.phoneNumber, [Validators.required, Validators.pattern('^(\\+\\d{1,3}\\s)?(\\d{2,3}[\\s.-]?){4}$')]],
      description:[this.locataire?.description]
    })

    this._ngxsAction.pipe(ofActionSuccessful(LocataireAction.UpdateLocataire)).subscribe((value)=>{
      // Navigate to the parent
      this.waittingResponse=false;  
      }
    );
    this._ngxsAction.pipe(ofActionCompleted(LocataireAction.UpdateLocataire)).subscribe(
      (value) => {
        this.waittingResponse=false;        
      }
    )

    this._ngxsAction.pipe(ofActionErrored(LocataireAction.UpdateLocataire)).subscribe(
      (value) => {
        this.waittingResponse=false;
      })
  }
  isValid(name) {
    const instance = this.formGroup.get(name)
    return instance.invalid && (instance.dirty || instance.touched)
  }

  onSubmitUpdateLocataire() {
    this.formGroup.markAllAsTouched()
    if(this.formGroup.invalid) return;
    this.waittingResponse=true;
    this._store.dispatch(new LocataireAction.UpdateLocataire({...FormUtils.removeNullAttribut(this.formGroup.value)},this.locataire._id));
    
  }

}

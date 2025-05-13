import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { LocataireModel, PropertyModel, PropertyState } from 'src/app/shared/store';

@Component({
  selector: 'app-property-locataire',
  templateUrl: './property-locataire.component.html',
  styleUrls: ['./property-locataire.component.scss']
})
export class PropertyLocataireComponent implements OnInit {
  isAssignedOpened = false;
  locataireSelected:LocataireModel=null;
  propertyId=null;
  property=null;
  constructor(
    private _activatedRoute: ActivatedRoute,
    private _router:Router,
    private _store:Store
  ) { }

  ngOnInit(): void {
    this.propertyId = this._activatedRoute.parent.snapshot.paramMap.get('id');
    if(!this.propertyId)  {
      this._router.navigateByUrl('/app/properties/home');;
      return;
    }
    this._store.select(PropertyState.selectStateProperty(this.propertyId)).subscribe((property:PropertyModel) => {
      this.property = property;
    })
  }

  onClose(event) {
      this.isAssignedOpened = false;
      this.locataireSelected = null;
    }

    onSelectedLocataire(locataire: LocataireModel) {
    this.locataireSelected = locataire;
    this.isAssignedOpened = true;
  }
}

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-property-locataire',
  templateUrl: './property-locataire.component.html',
  styleUrls: ['./property-locataire.component.scss']
})
export class PropertyLocataireComponent implements OnInit {
  
  propertyId=null;
  constructor(
    private _activatedRoute: ActivatedRoute,
    private _router:Router,
  ) { }

  ngOnInit(): void {
    this.propertyId = this._activatedRoute.parent.snapshot.paramMap.get('id');
    if(!this.propertyId)  {
      this._router.navigateByUrl('/app/properties/list');;
      return;
    }
  }

}

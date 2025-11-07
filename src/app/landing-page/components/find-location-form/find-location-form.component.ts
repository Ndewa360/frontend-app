import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { RoomType } from 'src/app/shared/store';
import { UtilsString } from 'src/app/shared/utils';

@Component({
  selector: 'find-location-form',
  templateUrl: './find-location-form.component.html',
  styleUrls: ['./find-location-form.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class FindLocationFormComponent implements OnInit {
    public formGroup: UntypedFormGroup;
    roomListType =[];

  
   constructor(
    protected formBuilder: UntypedFormBuilder,
    private router: Router,
    private route: ActivatedRoute
  ){} 
   
  ngOnInit(): void {
    this.formGroup = this.formBuilder.group({
          location: [''],
          propertyType: [''],
          price: [''],
        })

        //Room Type
      this.roomListType= Object.values(RoomType).map((valueRoomType)=>({
        content:UtilsString.getStringOfRoomType(valueRoomType), 
        valueType:valueRoomType,
        selected:false
      }));
  }
  
  isValid(name) {
    const instance = this.formGroup.get(name)
    return instance.invalid && (instance.dirty || instance.touched)
  }

  onSubmit() {
    this.formGroup.markAllAsTouched();
    
    // Vérifier qu'au moins un champ est rempli
    const formValues = this.formGroup.value;
    const hasAtLeastOneField = formValues.location || formValues.propertyType || formValues.price;
    
    if (hasAtLeastOneField) {
      const queryParams: any = {};
      
      // Mapper les champs du formulaire vers les paramètres de recherche
      if (formValues.location) {
        queryParams.city = formValues.location;
      }
      
      if (formValues.propertyType) {
        queryParams.roomType = formValues.propertyType;
      }
      
      if (formValues.price) {
        // Convertir le prix en fourchette (exemple: "50000" -> priceMax = 50000)
        const priceValue = parseInt(formValues.price);
        if (!isNaN(priceValue)) {
          queryParams.priceMax = priceValue;
        }
      }
      
      // Obtenir la langue actuelle depuis l'URL
      // Remonter dans la hiérarchie des routes pour trouver le paramètre lang
      let currentRoute = this.route;
      let currentLang = 'fr'; // valeur par défaut
      
      while (currentRoute) {
        if (currentRoute.snapshot.params['lang']) {
          currentLang = currentRoute.snapshot.params['lang'];
          break;
        }
        currentRoute = currentRoute.parent;
      }
      
      // Fallback: extraire depuis l'URL actuelle
      if (!currentRoute) {
        const urlSegments = this.router.url.split('/');
        if (urlSegments.length > 1 && (urlSegments[1] === 'fr' || urlSegments[1] === 'en')) {
          currentLang = urlSegments[1];
        }
      }
      
      // Naviguer vers la page de recherche avec les paramètres
      this.router.navigate([`/${currentLang}/search/index`], {
        queryParams
      });
    }
  }

}

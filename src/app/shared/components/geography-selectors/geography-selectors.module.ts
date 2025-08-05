import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

// Composants
import { CountrySelectorComponent } from '../country-selector/country-selector.component';
import { CitySelectorComponent } from '../city-selector/city-selector.component';
import { CountryCitySelectorComponent } from '../country-city-selector/country-city-selector.component';

/**
 * 🌍🏙️ MODULE DES SÉLECTEURS GÉOGRAPHIQUES
 * 
 * Module contenant tous les composants de sélection géographique :
 * - CountrySelectorComponent : Sélecteur de pays avec drapeau
 * - CitySelectorComponent : Sélecteur de ville avec autocomplétion
 * - CountryCitySelectorComponent : Composant combiné pays + ville
 * 
 * Fonctionnalités :
 * ✅ Autocomplétion avec recherche
 * ✅ Affichage des drapeaux pour les pays
 * ✅ Gestion des valeurs présélectionnées
 * ✅ Intégration avec les stores NGXS
 * ✅ Support des formulaires réactifs
 * ✅ Design cohérent avec IBM Carbon
 */

@NgModule({
  declarations: [
    CountrySelectorComponent,
    CitySelectorComponent,
    CountryCitySelectorComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  exports: [
    CountrySelectorComponent,
    CitySelectorComponent,
    CountryCitySelectorComponent
  ]
})
export class GeographySelectorsModule { }

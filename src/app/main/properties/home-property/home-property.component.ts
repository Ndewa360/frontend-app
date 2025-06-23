import { Component, ViewEncapsulation, OnInit, OnDestroy } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Store, Select } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AddPropertyComponent } from '../add-property/add-property.component';
import { PropertyState, PropertyAction } from 'src/app/shared/store';
import { PropertyModel } from 'src/app/shared/store/properties/property.model';

type ViewType = 'properties' | 'dashboard';

@Component({
  selector: 'home-property',
  templateUrl: './home-property.component.html',
  styleUrls: ['./home-property.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class HomePropertyComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private addPropertyDialogRef: MatDialogRef<AddPropertyComponent> | null = null;

  // Gestion des vues
  currentView: ViewType = 'properties';

  // Données
  propertyCount = 0;
  isLoading = false;

  @Select(PropertyState.selectStateProperties)
  properties$!: Observable<PropertyModel[]>;

  @Select(PropertyState.selectStateLoading)
  loading$!: Observable<boolean>;

  constructor(private dialog: MatDialog, private _store: Store) { }

  ngOnInit(): void {
    // Charger les propriétés au démarrage
    this._store.dispatch(new PropertyAction.FetchProperties());

    // Écouter les changements du nombre de propriétés
    this.properties$
      .pipe(takeUntil(this.destroy$))
      .subscribe(properties => {
        this.propertyCount = properties ? properties.length : 0;
        console.log('Nombre de propriétés:', this.propertyCount);
      });

    // Écouter l'état de chargement
    this.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.isLoading = loading;
      });
  }

  ngOnDestroy(): void {
    // Fermer la dialog si elle est ouverte
    if (this.addPropertyDialogRef) {
      this.addPropertyDialogRef.close();
    }

    this.destroy$.next();
    this.destroy$.complete();
  }

  // Navigation entre les vues
  switchView(view: ViewType): void {
    this.currentView = view;

    // Analytics ou actions spécifiques selon la vue
    if (view === 'dashboard') {
      console.log('Basculement vers le dashboard financier');
    } else {
      console.log('Basculement vers la liste des propriétés');
    }
  }

  // Création d'une nouvelle propriété
  onCreate(): void {
    // Éviter d'ouvrir plusieurs dialogs
    if (this.addPropertyDialogRef) {
      return;
    }

    this.addPropertyDialogRef = this.dialog.open(AddPropertyComponent, {
      viewContainerRef: null,
      disableClose: true,
      role: 'alertdialog',
      width: '500px',
      maxWidth: '90vw',
      maxHeight: '90vh'
    });

    // Après création, revenir à la vue propriétés
    this.addPropertyDialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.addPropertyDialogRef = null; // Reset de la référence

        if (result) {
          console.log('Propriété créée avec succès');
          this.switchView('properties');
          // Recharger les propriétés pour mettre à jour le compteur
          this._store.dispatch(new PropertyAction.FetchProperties());
        }
      });
  }

  // Méthodes utilitaires pour le template
  isPropertiesView(): boolean {
    return this.currentView === 'properties';
  }

  isDashboardView(): boolean {
    return this.currentView === 'dashboard';
  }

  // Méthode pour rafraîchir les données
  refreshData(): void {
    this._store.dispatch(new PropertyAction.FetchProperties());
  }

  // Méthode pour vérifier si des propriétés existent
  hasProperties(): boolean {
    return this.propertyCount > 0;
  }

  // Méthode pour obtenir le texte du compteur
  getPropertyCountText(): string {
    if (this.propertyCount === 0) {
      return 'Aucune propriété';
    } else if (this.propertyCount === 1) {
      return '1 propriété';
    } else {
      return `${this.propertyCount} propriétés`;
    }
  }
}

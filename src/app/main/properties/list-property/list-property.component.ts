import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import { PropertyModel, PropertyState, RoomState, LocationPaymentState, LocationState } from 'src/app/shared/store';
import { AddPropertyComponent } from '../add-property/add-property.component';
import { Store } from '@ngxs/store';
import { GaleryPropertyComponent } from '../components/galery-property/galery-property.component';
import { UpdatePropertyComponent } from '../components/update-property/update-property.component';
import { PropertyAlert } from '../../dashboard/components/property-overview-card/property-overview-card.component';
import { AddPropertyLocataireComponent } from '../components/add-property-locataire/add-property-locataire.component';

@Component({
  selector: 'app-list-property',
  templateUrl: './list-property.component.html',
  styleUrls: ['./list-property.component.scss'],
  encapsulation:ViewEncapsulation.None
})
export class ListPropertyComponent implements OnInit {


  @Select(PropertyState.selectStateProperties) properties$:Observable<PropertyModel[]>;
  @Select(PropertyState.selectStateInitLoading) initLoading$:Observable<string>;
 
 

  constructor(
    private dialog: MatDialog,
    private _store: Store,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.initLoading$.subscribe((value)=>{
      console.log("Init Loading Property ",value)
    })
    this.properties$.subscribe((value)=>{
      console.log("Value Property ",value)
    })
  }


  getNumberOfRoom(propertyID)
  {
    return this._store.select(RoomState.selectStateNumberOfRoomByPropertyId(propertyID))
  }

  openEditPhoto(property:PropertyModel,event)
    {
      // this._router.navigate(['/app/properties/edit-room',room._id])
      event.stopPropagation();
      this.dialog.open(GaleryPropertyComponent, { 
        viewContainerRef:null,
        disableClose: true,
        role: 'dialog',
        height: '100%',
        width: '100%',
        data:{
          property
        }
      })
    }

    updateProperty(property,event)
      {
        event.stopPropagation();
        this.dialog.open(UpdatePropertyComponent, {
          viewContainerRef:null,
          disableClose: true,
          role: 'alertdialog',
          width: '500px',
          data:{
            property
          }
        })
      }

  // Méthodes pour le nouveau composant PropertyOverviewCard
  trackByPropertyId(index: number, property: PropertyModel): string {
    return property._id;
  }

  getPropertyOccupancyRate(propertyId: string): number {
    // Calculer le taux d'occupation basé sur les chambres occupées
    // Cette logique devrait être adaptée selon votre modèle de données
    const rooms = this._store.selectSnapshot(RoomState.selectStateRoomByPropertyId(propertyId));
    if (!rooms || rooms.length === 0) return 0;

    const occupiedRooms = rooms.filter(room => !room.isFree).length;
    return Math.round((occupiedRooms / rooms.length) * 100);
  }

  getMonthlyRevenue(propertyId: string): number {
    // Calculer les revenus mensuels pour cette propriété
    // Cette logique devrait être adaptée selon votre modèle de données
    const payments = this._store.selectSnapshot(LocationPaymentState.selectStateLocationPaymentByPropertyId(propertyId));
    if (!payments) return 0;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return payments
      .filter(payment => {
        const paymentDate = new Date(payment.datePayment);
        return paymentDate.getMonth() === currentMonth &&
               paymentDate.getFullYear() === currentYear &&
               payment.isPaid;
      })
      .reduce((total, payment) => total + (payment.amount || 0), 0);
  }

  getRevenueGrowth(propertyId: string): number {
    // Calculer la croissance des revenus par rapport au mois précédent
    // Logique simplifiée - à adapter selon vos besoins
    return Math.floor(Math.random() * 20) - 10; // Valeur temporaire
  }

  getOverduePayments(propertyId: string): number {
    // Compter les paiements en retard
    const payments = this._store.selectSnapshot(LocationPaymentState.selectStateLocationPaymentByPropertyId(propertyId));
    if (!payments) return 0;

    const today = new Date();
    return payments.filter(payment => {
      const dueDate = new Date(payment.datePayment);
      return dueDate < today && !payment.isPaid;
    }).length;
  }

  getFreeRooms(propertyId: string): number {
    const rooms = this._store.selectSnapshot(RoomState.selectStateRoomByPropertyId(propertyId));
    if (!rooms) return 0;
    return rooms.filter(room => room.isFree).length;
  }

  getOccupiedRooms(propertyId: string): number {
    const rooms = this._store.selectSnapshot(RoomState.selectStateRoomByPropertyId(propertyId));
    if (!rooms) return 0;
    return rooms.filter(room => !room.isFree).length;
  }

  getPropertyAlerts(propertyId: string): PropertyAlert[] {
    const alerts: PropertyAlert[] = [];

    // Vérifier les paiements en retard
    const overdueCount = this.getOverduePayments(propertyId);
    if (overdueCount > 0) {
      alerts.push({
        type: overdueCount > 2 ? 'critical' : 'warning',
        message: `${overdueCount} paiement(s) en retard`,
        actionRoute: `/app/properties/${propertyId}/payments`
      });
    }

    // Vérifier les chambres vacantes depuis longtemps
    const freeRooms = this.getFreeRooms(propertyId);
    if (freeRooms > 0) {
      alerts.push({
        type: 'info',
        message: `${freeRooms} chambre(s) libre(s)`,
        actionRoute: `/app/properties/${propertyId}/rooms`
      });
    }

    return alerts;
  }

  // Gestionnaires d'événements pour le nouveau composant
  onAddTenant(property: PropertyModel): void {
    this.dialog.open(AddPropertyLocataireComponent, {
      viewContainerRef: null,
      disableClose: true,
      role: 'alertdialog',
      width: '500px',
      data: { property }
    });
  }

  onRecordPayment(property: PropertyModel): void {
    this.router.navigate(['/app/location-payment', 'add'], {
      queryParams: { propertyId: property._id }
    });
  }

  onViewFinances(property: PropertyModel): void {
    this.router.navigate(['/app/properties', property._id], {
      fragment: 'finances'
    });
  }

  onAlertClick(alert: PropertyAlert): void {
    if (alert.actionRoute) {
      this.router.navigate([alert.actionRoute]);
    }
  }

  // Nouvelles méthodes pour la navigation et les actions
  onViewPropertyDetails(property: PropertyModel): void {
    // Naviguer vers la page de détails complète
    this.router.navigate(['/app/properties/details', property._id]);
  }

  onEditProperty(property: PropertyModel): void {
    // Naviguer vers la page d'édition
    this.router.navigate(['/app/properties/update', property._id]);
  }

  onToggleFavorite(property: PropertyModel): void {
    // Logique pour ajouter/supprimer des favoris
    // À implémenter selon votre système de favoris
    console.log('Toggle favorite for property:', property.name);
  }

  onQuickAction(property: PropertyModel): void {
    // Afficher un menu d'actions rapides ou naviguer vers une page d'actions
    console.log('Quick action for property:', property.name);
    // Exemple : ouvrir un menu contextuel ou naviguer vers les actions rapides
  }

  onAddProperty(): void {
    // Naviguer vers la page d'ajout de propriété
    this.router.navigate(['/app/properties/add']);
  }

  // Méthodes pour les métriques globales du header
  getTotalProperties(): number {
    const properties = this._store.selectSnapshot(PropertyState.selectStateProperties);
    return properties ? properties.length : 0;
  }

  getTotalUnits(): number {
    const properties = this._store.selectSnapshot(PropertyState.selectStateProperties);
    if (!properties) return 0;

    return properties.reduce((total, property) => {
      return total + (property.roomLength || 0);
    }, 0);
  }

  getOccupancyRate(): number {
    const properties = this._store.selectSnapshot(PropertyState.selectStateProperties);
    if (!properties || properties.length === 0) return 0;

    let totalRooms = 0;
    let occupiedRooms = 0;

    properties.forEach(property => {
      const rooms = this._store.selectSnapshot(RoomState.selectStateRoomByPropertyId(property._id));
      if (rooms) {
        totalRooms += rooms.length;
        occupiedRooms += rooms.filter(room => !room.isFree).length;
      }
    });

    return totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
  }

  getTotalMonthlyRevenue(): number {
    const properties = this._store.selectSnapshot(PropertyState.selectStateProperties);
    if (!properties) return 0;

    return properties.reduce((total, property) => {
      // Calculer le revenu mensuel pour chaque propriété
      const rooms = this._store.selectSnapshot(RoomState.selectStateRoomByPropertyId(property._id));
      if (!rooms) return total;

      const monthlyRevenue = rooms
        .filter(room => !room.isFree)
        .reduce((sum, room) => sum + (room.price || 0), 0);

      return total + monthlyRevenue;
    }, 0);
  }

}

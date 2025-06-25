import { Injectable } from '@angular/core';
import { Store } from '@ngxs/store';
import { Observable, BehaviorSubject } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';
import { 
  RoomModel, 
  LocataireModel, 
  LocataireState,
  HistoryLocationPaymentState,
  HistoryLocationPaymentAction,
  LocationPaymentModel,
  HistoryLocationPaymentModel,
  LocationModel,
  LocationState
} from 'src/app/shared/store';

export interface UnitDetailsData {
  room: RoomModel;
  tenant: LocataireModel | null;
  payments: LocationPaymentModel[];
  paymentHistory: HistoryLocationPaymentModel | null;
  location: LocationModel | null;
}

@Injectable({
  providedIn: 'root'
})
export class UnitDetailsService {
  private currentUnitSubject = new BehaviorSubject<UnitDetailsData | null>(null);
  public currentUnit$ = this.currentUnitSubject.asObservable();

  constructor(private store: Store) {}

  /**
   * Charge toutes les données nécessaires pour une unité
   */
  loadUnitDetails(room: RoomModel, propertyId: string): Observable<UnitDetailsData> {
    // Charger l'historique des paiements si pas déjà fait
    this.store.dispatch(new HistoryLocationPaymentAction.FetchHistoryLocationPaymentsByPropertyId(propertyId));

    return new Observable(observer => {
      const unitData: UnitDetailsData = {
        room,
        tenant: null,
        payments: [],
        paymentHistory: null,
        location: null
      };

      // Charger le locataire si présent
      if (room.locataire) {
        this.store.select(LocataireState.selectStateLocataire(room.locataire))
          .subscribe(tenant => {
            unitData.tenant = tenant;
            this.updateCurrentUnit(unitData);
          });
      }

      // Charger l'historique des paiements
      this.store.select(HistoryLocationPaymentState.selectStateHistoryLocationPayments)
        .subscribe(allPaymentHistory => {
          const roomPaymentHistory = allPaymentHistory.find(history => 
            history.room._id === room._id
          );
          
          unitData.paymentHistory = roomPaymentHistory || null;
          unitData.payments = roomPaymentHistory?.transactions || [];
          this.updateCurrentUnit(unitData);
        });

      // Charger la location si elle existe
      this.store.select(LocationState.selectStateLocations)
        .pipe(
          map(locations => locations.find(loc => loc.room === room._id))
        )
        .subscribe(location => {
          unitData.location = location || null;
          this.updateCurrentUnit(unitData);
        });

      observer.next(unitData);
    });
  }

  private updateCurrentUnit(unitData: UnitDetailsData): void {
    this.currentUnitSubject.next(unitData);
  }

  getCurrentUnit(): UnitDetailsData | null {
    return this.currentUnitSubject.value;
  }

  /**
   * Formate les paiements pour l'affichage
   */
  getFormattedPayments(unitData: UnitDetailsData): any[] {
    if (!unitData.paymentHistory) return [];

    return unitData.paymentHistory.transactions.map((transaction) => ({
      chambre: this.getRoomString(unitData.room),
      date_paiement: this.formatPaymentDateLong(transaction.datePayment),
      price: this.formatPrice(transaction.locationPaymentPrice || 0),
      date: new Date(transaction.datePayment),
      history: unitData.paymentHistory,
      transaction: transaction
    })).sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  private getRoomString(room: RoomModel): string {
    let str = "";
    switch (room.type) {
      case 'room':
        str = `Chambre #${room.code}`;
        break;
      case 'studio':
        str = `Studio #${room.code}`;
        break;
      case 'simple_apartment':
        str = `Appartement #${room.code}`;
        break;
      case 'furnished_apartment':
        str = `Appartement Meublé #${room.code}`;
        break;    
      default:
        str = `Unité #${room.code}`;
        break;
    }
    return str;
  }

  private formatPaymentDateLong(date: Date | string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  private formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(price);
  }

  /**
   * Calculs financiers
   */
  getTotalPayments(unitData: UnitDetailsData): number {
    return unitData.payments.reduce((total, payment) => total + (payment.locationPaymentPrice || 0), 0);
  }

  getPaymentCount(unitData: UnitDetailsData): number {
    return unitData.payments.length;
  }

  /**
   * Statuts et formatage
   */
  getRoomStatus(room: RoomModel): 'occupied' | 'available' | 'maintenance' {
    if (!room) return 'maintenance';
    if (room.isFree === true) return 'available';
    if (room.isFree === false) return 'occupied';
    return 'maintenance';
  }

  getRoomStatusLabel(room: RoomModel): string {
    const status = this.getRoomStatus(room);
    switch (status) {
      case 'available': return 'Disponible';
      case 'occupied': return 'Occupée';
      case 'maintenance': return 'En maintenance';
      default: return 'Statut inconnu';
    }
  }
}

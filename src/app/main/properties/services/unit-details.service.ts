import { Injectable } from '@angular/core';
import { Store } from '@ngxs/store';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { takeUntil, map, switchMap } from 'rxjs/operators';
import { 
  RoomModel, 
  LocataireModel, 
  LocataireState,
  LocataireAction,
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
   * Les données sont déjà chargées par LoadingPropertyDataResolver
   */
  loadUnitDetails(room: RoomModel, propertyId: string): Observable<UnitDetailsData> {
    // Les données sont déjà chargées par le resolver, on les récupère directement
    return combineLatest([
      this.store.select(LocataireState.selectStateLocataires),
      this.store.select(HistoryLocationPaymentState.selectStateHistoryLocationPayments),
      this.store.select(LocationState.selectStateLocations)
    ]).pipe(
      map(([locataires, paymentHistory, locations]) => {
        const unitData: UnitDetailsData = {
          room,
          tenant: null,
          payments: [],
          paymentHistory: null,
          location: null
        };

        // Trouver le locataire associé à cette chambre
        if (room.locataire) {
          unitData.tenant = locataires.find(l => l._id === room.locataire) || null;
        }

        // Trouver l'historique des paiements pour cette chambre
        const roomPaymentHistory = paymentHistory.find(history => 
          history.room._id === room._id
        );
        unitData.paymentHistory = roomPaymentHistory || null;
        unitData.payments = roomPaymentHistory?.transactions || [];

        // Trouver la location associée
        unitData.location = locations.find(loc => loc.room === room._id) || null;

        this.updateCurrentUnit(unitData);
        return unitData;
      })
    );
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

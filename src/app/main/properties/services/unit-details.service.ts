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
  // ✅ Dates de paiement calculées
  lastPaymentDate: Date | null;
  nextPaymentDate: Date | null;
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
          location: null,
          lastPaymentDate: null,
          nextPaymentDate: null
        };

        if (room.locataire) {
          unitData.tenant = locataires.find(l => l._id === room.locataire) || null;
        }

        const roomPaymentHistory = paymentHistory.find(h => h.room._id === room._id);
        unitData.paymentHistory = roomPaymentHistory || null;
        unitData.payments = roomPaymentHistory?.transactions || [];

        unitData.location = locations.find(loc => loc.room === room._id) || null;

        // ✅ Calcul des dates de paiement
        unitData.lastPaymentDate = this.computeLastPaymentDate(unitData.payments);
        unitData.nextPaymentDate = this.computeNextPaymentDate(
          unitData.location,
          unitData.payments,
          room.price
        );

        this.updateCurrentUnit(unitData);
        return unitData;
      })
    );
  }

  /**
   * Calcule la date du dernier paiement de loyer
   */
  computeLastPaymentDate(payments: LocationPaymentModel[]): Date | null {
    const rentPayments = payments.filter(p => (p as any).paymentLocationType === 'LOCATION' || !(p as any).paymentLocationType);
    if (rentPayments.length === 0) return null;
    const sorted = [...rentPayments].sort((a, b) =>
      new Date(b.datePayment).getTime() - new Date(a.datePayment).getTime()
    );
    return sorted[0]?.datePayment ? new Date(sorted[0].datePayment) : null;
  }

  /**
   * Calcule la date du prochain paiement
   * Logique : date d'entrée + nombre de mois couverts par les paiements
   * Si la date calculée est passée, retourne le 1er du mois prochain
   */
  computeNextPaymentDate(
    location: LocationModel | null,
    payments: LocationPaymentModel[],
    monthlyRent: number
  ): Date | null {
    if (!location?.startedAt) return null;
    // Contrat terminé
    if (location.endedAt && new Date(location.endedAt) < new Date()) return null;

    const entryDate = location.isKnowExactDateEntry && location.startedAt
      ? new Date(location.startedAt)
      : new Date(location.createdAt || location.startedAt);

    const rentPayments = payments.filter(p => (p as any).paymentLocationType === 'LOCATION' || !(p as any).paymentLocationType);
    const totalPaid = rentPayments.reduce((sum, p) => sum + (p.locationPaymentPrice || 0), 0);
    const monthsCovered = monthlyRent > 0 ? Math.floor(totalPaid / monthlyRent) : 0;

    const nextDate = new Date(entryDate.getFullYear(), entryDate.getMonth() + monthsCovered, 1);
    const now = new Date();

    if (nextDate <= now) {
      return new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }
    return nextDate;
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

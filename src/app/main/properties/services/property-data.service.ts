import { Injectable } from '@angular/core';
import { Store } from '@ngxs/store';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { 
  PropertyModel, 
  RoomModel, 
  LocataireModel,
  PropertyState,
  RoomState,
  LocataireState,
  LocationPaymentState,
  RoomType
} from 'src/app/shared/store';
import { UtilsString } from 'src/app/shared/utils';

export interface Unit {
  id: string;
  name: string;
  code: string;
  type: string;
  surface: string | number;
  price: number;
  status: 'occupied' | 'available' | 'maintenance';
  image?: string | null;
  description?: string;
  hasKitchen?: boolean;
  numberOfBathroom?: number;
  numberOfLivingRoom?: number;
  numberOfShower?: number;
  isInternalShower?: boolean;
  isInternalKitchen?: boolean;
  isActiveForSouscription?: boolean;
  shouldPayCaution?: boolean;
  cautionPrice?: number;
  isShowToPublic?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  tenant?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    leaseStart?: Date;
    fullData?: any;
  };
  rawRoom?: RoomModel;
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  unitId: string;
  unitName: string;
  rentAmount: number;
  leaseStart: Date;
  leaseEnd: Date;
  status: 'active' | 'pending' | 'expired';
}

export interface HistoryItem {
  id: string;
  date: Date;
  type: 'payment' | 'maintenance' | 'tenant_move_in' | 'tenant_move_out' | 'contract_renewal';
  description: string;
  amount?: number;
  unitId?: string;
  tenantId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PropertyDataService {

  constructor(private store: Store) { }

  /**
   * Récupère une propriété par son ID
   */
  getProperty(propertyId: string): Observable<PropertyModel | null> {
    return this.store.select(PropertyState.selectStateProperties).pipe(
      map(properties => properties.find(p => p._id === propertyId) || null)
    );
  }

  /**
   * Récupère les unités d'une propriété transformées
   */
  getPropertyUnits(propertyId: string): Observable<Unit[]> {
    return combineLatest([
      this.store.select(RoomState.selectStateRoomByPropertyId(propertyId)),
      this.store.select(LocataireState.selectStateLocataireByPropertyId(propertyId))
    ]).pipe(
      map(([rooms, locataires]) => {
        if (!rooms || rooms.length === 0) return [];
        
        return rooms.map(room => this.transformRoomToUnit(room, locataires || []));
      })
    );
  }

  /**
   * Récupère les locataires d'une propriété transformés
   */
  getPropertyTenants(propertyId: string): Observable<Tenant[]> {
    return combineLatest([
      this.store.select(LocataireState.selectStateLocataireByPropertyId(propertyId)),
      this.getPropertyUnits(propertyId)
    ]).pipe(
      map(([locataires, units]) => {
        if (!locataires || locataires.length === 0) return [];
        
        return locataires.map(locataire => this.transformLocataireToTenant(locataire, units));
      })
    );
  }

  /**
   * Récupère l'historique d'une propriété
   */
  getPropertyHistory(propertyId: string): Observable<HistoryItem[]> {
    return this.store.select(LocationPaymentState.selectStateLocationPaymentByPropertyId(propertyId)).pipe(
      map(payments => {
        if (!payments || payments.length === 0) return [];

        // FIX #F6 : utiliser les vrais noms de champs du modèle LocationPayment
        // locationPaymentPrice (pas amount), room (pas roomId), locataire (pas locataireId)
        return payments.map(payment => ({
          id: payment._id,
          date: new Date(payment.createdAt || Date.now()),
          type: 'payment' as const,
          description: `Paiement de loyer - ${payment.locationPaymentPrice || 0} XAF`,
          amount: payment.locationPaymentPrice || 0,
          unitId: payment.room || null,
          tenantId: payment.locataire || null
        }));
      })
    );
  }

  /**
   * Récupère les états de chargement
   */
  getLoadingStates(): Observable<{
    property: boolean;
    units: boolean;
    tenants: boolean;
  }> {
    return combineLatest([
      this.store.select(PropertyState.selectStateLoading),
      this.store.select(RoomState.selectStateLoading),
      this.store.select(LocataireState.selectStateLoading)
    ]).pipe(
      map(([propertyLoading, unitsLoading, tenantsLoading]) => ({
        property: propertyLoading,
        units: unitsLoading,
        tenants: tenantsLoading
      }))
    );
  }

  /**
   * Transforme un RoomModel en Unit
   */
  private transformRoomToUnit(room: RoomModel, locataires: any[]): Unit {
    const tenant = this.getTenantForRoom(room._id, locataires);
    
    return {
      id: room._id,
      name: room.code || `${this.getRoomTypeLabel(room.type)} ${room._id.slice(-4)}`,
      code: room.code,
      type: this.getRoomTypeLabel(room.type),
      surface: this.formatRoomSurface(room),
      price: room.price || 0,
      status: room.isFree ? 'available' : 'occupied',
      image: room.medias && room.medias.length > 0 ? room.medias[0] : null,
      description: room.description,
      hasKitchen: room.specifity?.hasKitchen || false,
      numberOfBathroom: room.specifity?.numberOfBathroom || 0,
      numberOfLivingRoom: room.specifity?.numberOfLivingRoom || 0,
      numberOfShower: room.specifity?.numberOfShower || 0,
      isInternalShower: room.specifity?.isInternalShower || false,
      isInternalKitchen: room.specifity?.isInternalKitchen || false,
      isActiveForSouscription: room.isActiveForSouscription || false,
      shouldPayCaution: room.shouldPayCaution || false,
      cautionPrice: room.cautionPrice || 0,
      isShowToPublic: room.isShowToPublic || false,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      tenant,
      rawRoom: room
    };
  }

  /**
   * Transforme un LocataireModel en Tenant
   */
  private transformLocataireToTenant(locataire: any, units: Unit[]): Tenant {
    const unit = units.find(u => u.id === locataire.room);
    
    return {
      id: locataire._id,
      name: locataire.fullName || `${locataire.firstName || ''} ${locataire.lastName || ''}`.trim() || 'Locataire',
      email: locataire.email || 'email@example.com',
      phone: locataire.phoneNumber || '+237 6XX XX XX XX',
      unitId: locataire.room || '',
      unitName: unit ? unit.name : 'Unité inconnue',
      rentAmount: locataire.monthlyRent || 0,
      leaseStart: new Date(locataire.createdAt || Date.now()),
      leaseEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 an plus tard
      status: 'active'
    };
  }

  /**
   * Récupère le locataire assigné à une chambre
   */
  private getTenantForRoom(roomId: string, locataires: any[]): Unit['tenant'] | undefined {
    const tenant = locataires.find(l => l.room === roomId);
    
    if (tenant) {
      return {
        id: tenant._id,
        name: tenant.fullName || `${tenant.firstName || ''} ${tenant.lastName || ''}`.trim() || 'Locataire',
        email: tenant.email || 'N/A',
        phone: tenant.phoneNumber || 'N/A',
        leaseStart: new Date(tenant.createdAt || Date.now()),
        fullData: tenant
      };
    }
    
    return undefined;
  }

  /**
   * Formate la surface d'une chambre
   */
  private formatRoomSurface(room: RoomModel): string {
    const details = [];
    if (room.specifity?.numberOfBathroom) {
      details.push(`${room.specifity.numberOfBathroom} SDB`);
    }
    if (room.specifity?.numberOfLivingRoom) {
      details.push(`${room.specifity.numberOfLivingRoom} salon${room.specifity.numberOfLivingRoom > 1 ? 's' : ''}`);
    }
    return details.length > 0 ? details.join(', ') : 'N/A';
  }

  /**
   * Obtient le label d'un type de chambre
   */
  private getRoomTypeLabel(type: RoomType | string): string {
    if (typeof type === 'string') {
      return UtilsString.getStringOfRoomType(type as RoomType) || type;
    }
    return UtilsString.getStringOfRoomType(type);
  }

  /**
   * Obtient les équipements par défaut d'une propriété
   */
  getDefaultPropertyAmenities(): string[] {
    return [
      'Parking',
      'Sécurité 24h/24',
      'Générateur',
      'Eau courante',
      'Internet',
      'Ascenseur'
    ];
  }
}

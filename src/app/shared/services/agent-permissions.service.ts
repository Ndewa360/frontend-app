import { Injectable } from '@angular/core';
import { Store } from '@ngxs/store';
import { UserProfileState } from '../store/user-profile/user-profile.state';
import { PropertyModel } from '../store/properties/property.model';
import { RoomModel } from '../store/rooms/room.model';

@Injectable({
  providedIn: 'root'
})
export class AgentPermissionsService {

  constructor(private store: Store) {}

  /**
   * Vérifie si l'utilisateur actuel est un agent
   */
  isAgent(): boolean {
    const user = this.store.selectSnapshot(UserProfileState.selectStateUserProfile);
    return user?.userType === 'AGENT';
  }

  /**
   * Vérifie si l'utilisateur peut voir les finances d'une propriété
   */
  canViewFinances(property?: PropertyModel): boolean {
    if (!this.isAgent()) return true; // Les propriétaires peuvent tout voir
    return false; // Les agents ne peuvent pas voir les finances
  }

  /**
   * Vérifie si l'utilisateur peut gérer les locataires
   */
  canManageTenants(property?: PropertyModel): boolean {
    if (!this.isAgent()) return true; // Les propriétaires peuvent tout faire
    return false; // Les agents ne peuvent pas gérer les locataires
  }

  /**
   * Vérifie si l'utilisateur peut assigner un locataire à une unité
   */
  canAssignTenant(property?: PropertyModel, room?: RoomModel): boolean {
    if (!this.isAgent()) return true; // Les propriétaires peuvent tout faire
    return false; // Les agents ne peuvent pas assigner de locataires
  }

  /**
   * Vérifie si l'utilisateur peut résilier un contrat
   */
  canTerminateContract(property?: PropertyModel, room?: RoomModel): boolean {
    if (!this.isAgent()) return true; // Les propriétaires peuvent tout faire
    return false; // Les agents ne peuvent pas résilier de contrats
  }

  /**
   * Vérifie si l'utilisateur peut créer des unités locatives
   */
  canCreateUnits(property?: PropertyModel): boolean {
    return true; // Tous les utilisateurs peuvent créer des unités
  }

  /**
   * Vérifie si l'utilisateur peut modifier une unité
   */
  canEditUnit(property?: PropertyModel, room?: RoomModel): boolean {
    return true; // Tous les utilisateurs peuvent modifier les unités
  }

  /**
   * Vérifie si l'utilisateur peut voir l'onglet finances
   */
  canAccessFinancesTab(): boolean {
    return !this.isAgent(); // Seuls les propriétaires peuvent voir les finances
  }

  /**
   * Vérifie si l'utilisateur peut voir l'onglet locataires
   */
  canAccessTenantsTab(): boolean {
    return !this.isAgent(); // Seuls les propriétaires peuvent gérer les locataires
  }

  /**
   * Obtient la liste des onglets autorisés pour l'utilisateur
   */
  getAllowedTabs(): string[] {
    const baseTabs = ['overview', 'units', 'history'];
    
    if (!this.isAgent()) {
      // Propriétaires : accès complet
      return [...baseTabs, 'tenants', 'finances'];
    } else {
      // Agents : accès limité
      return baseTabs;
    }
  }

  /**
   * Vérifie si l'utilisateur peut effectuer une action spécifique
   */
  canPerformAction(action: string, property?: PropertyModel, room?: RoomModel): boolean {
    switch (action) {
      case 'view_finances':
        return this.canViewFinances(property);
      case 'manage_tenants':
        return this.canManageTenants(property);
      case 'assign_tenant':
        return this.canAssignTenant(property, room);
      case 'terminate_contract':
        return this.canTerminateContract(property, room);
      case 'create_units':
        return this.canCreateUnits(property);
      case 'edit_unit':
        return this.canEditUnit(property, room);
      default:
        return true;
    }
  }

  /**
   * Obtient le rôle de l'utilisateur sur une propriété
   */
  getUserRole(property?: PropertyModel): 'owner' | 'agent' {
    if (!property) return this.isAgent() ? 'agent' : 'owner';
    
    const currentUser = this.store.selectSnapshot(UserProfileState.selectStateUserProfile);
    
    // Vérifier si l'utilisateur est le propriétaire
    if (property.owner === currentUser?._id) {
      return 'owner';
    }
    
    // Vérifier si l'utilisateur est l'agent gestionnaire
    if (property.managedByAgent === currentUser?._id) {
      return 'agent';
    }
    
    // Par défaut, utiliser le type d'utilisateur
    return this.isAgent() ? 'agent' : 'owner';
  }

  /**
   * Obtient les restrictions pour un agent
   */
  getAgentRestrictions(): string[] {
    if (!this.isAgent()) return [];
    
    return [
      'Vous ne pouvez pas voir les informations financières',
      'Vous ne pouvez pas gérer les locataires directement',
      'Vous ne pouvez pas assigner ou résilier des contrats',
      'Vous pouvez uniquement indiquer si une unité est disponible'
    ];
  }
}
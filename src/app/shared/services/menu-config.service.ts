import { Injectable } from '@angular/core';
import { MenuType } from '../../../@youpez/types';

@Injectable({
  providedIn: 'root'
})
export class MenuConfigService {

  constructor() {}

  // Menu pour les propriétaires (existant)
  getOwnerMenu(): MenuType[] {
    return [
      {
        groupName: 'Navigation',
        opened: true,
        children: [
          {
            name: 'Tableau de bord',
            url: '/main/dashboard',
            prefix: { type: 'icon', name: 'dashboard' }
          },
          {
            name: 'Mes Propriétés',
            url: '/main/properties',
            prefix: { type: 'icon', name: 'home' },
            subtitle: 'Gérer vos biens immobiliers'
          },
          {
            name: 'Mes Chambres',
            url: '/main/room',
            prefix: { type: 'icon', name: 'door' }
          },
          {
            name: 'Locations',
            url: '/main/assign-location',
            prefix: { type: 'icon', name: 'user--multiple' }
          },
          {
            name: 'Paiements',
            url: '/main/location-payment',
            prefix: { type: 'icon', name: 'wallet' }
          },
          {
            name: 'Contrats',
            url: '/main/contract',
            prefix: { type: 'icon', name: 'document' }
          }
        ]
      },
      {
        groupName: 'Gestion',
        opened: false,
        children: [
          {
            name: 'Statistiques',
            url: '/main/statistics',
            prefix: { type: 'icon', name: 'analytics' }
          },
          {
            name: 'Facturation',
            url: '/main/biiling',
            prefix: { type: 'icon', name: 'receipt' }
          },
          {
            name: 'Mon Profil',
            url: '/main/user-profile',
            prefix: { type: 'icon', name: 'user--profile' }
          }
        ]
      }
    ];
  }

  // Menu pour les agents immobiliers (utilise le même menu de base)
  getAgentMenu(): MenuType[] {
    return this.getOwnerMenu();
  }

  // Menu pour les locataires (existant)
  getTenantMenu(): MenuType[] {
    return [
      {
        groupName: 'Mon Logement',
        opened: true,
        children: [
          {
            name: 'Rechercher',
            url: '/search',
            prefix: { type: 'icon', name: 'search' }
          },
          {
            name: 'Mes Favoris',
            url: '/main/favorites',
            prefix: { type: 'icon', name: 'favorite' }
          },
          {
            name: 'Mon Contrat',
            url: '/main/my-contract',
            prefix: { type: 'icon', name: 'document' }
          },
          {
            name: 'Mes Paiements',
            url: '/main/my-payments',
            prefix: { type: 'icon', name: 'wallet' }
          }
        ]
      }
    ];
  }

  // Menu pour les administrateurs (existant + gestion agents)
  getAdminMenu(): MenuType[] {
    return [
      {
        groupName: 'Administration',
        opened: true,
        children: [
          {
            name: 'Tableau de bord Admin',
            url: '/main/admin/dashboard',
            prefix: { type: 'icon', name: 'dashboard' }
          },
          {
            name: 'Gestion Utilisateurs',
            url: '/main/admin/users',
            prefix: { type: 'icon', name: 'user--multiple' }
          },
          {
            name: 'Validation Agents',
            url: '/main/admin/agents/validation',
            prefix: { type: 'icon', name: 'checkmark--outline' },
            suffix: { type: 'badge', level: 'warning', text: 'Nouveau' }
          },
          {
            name: 'Gestion Agents',
            url: '/main/admin/agents',
            prefix: { type: 'icon', name: 'user--identification' }
          },
          {
            name: 'Validation Biens',
            url: '/main/admin/properties/validation',
            prefix: { type: 'icon', name: 'home' }
          }
        ]
      },
      {
        groupName: 'Monitoring',
        opened: false,
        children: [
          {
            name: 'Système',
            url: '/main/monitoring/system',
            prefix: { type: 'icon', name: 'monitor' }
          },
          {
            name: 'Analytics',
            url: '/main/monitoring/analytics',
            prefix: { type: 'icon', name: 'analytics' }
          },
          {
            name: 'Logs',
            url: '/main/monitoring/logs',
            prefix: { type: 'icon', name: 'document--tasks' }
          }
        ]
      }
    ];
  }

  // Méthode pour obtenir le menu selon le rôle de l'utilisateur
  getMenuByUserRole(userRoles: string[]): MenuType[] {
    // Vérifier si l'utilisateur est un admin
    if (this.hasRole(userRoles, 'ADMIN')) {
      return this.getAdminMenu();
    }
    
    // Vérifier si l'utilisateur est un locataire
    if (this.hasRole(userRoles, 'TENANT')) {
      return this.getTenantMenu();
    }
    
    // Agents et propriétaires utilisent le même menu
    return this.getOwnerMenu();
  }

  private hasRole(userRoles: string[], role: string): boolean {
    return userRoles.some(userRole => userRole.toUpperCase().includes(role));
  }

  // Méthode pour obtenir les actions rapides selon le rôle
  getQuickActionsByRole(userRoles: string[]): any[] {
    if (this.hasRole(userRoles, 'AGENT')) {
      return [
        {
          title: 'Ajouter un Bien',
          description: 'Publier un nouveau bien immobilier',
          icon: 'add',
          url: '/main/properties/create',
          color: 'primary'
        },
        {
          title: 'Mes Prospects',
          description: 'Voir les contacts générés',
          icon: 'user--follow',
          url: '/main/agent/prospects',
          color: 'success'
        },
        {
          title: 'Mes Statistiques',
          description: 'Performance détaillée',
          icon: 'analytics',
          url: '/main/agent/stats',
          color: 'info'
        }
      ];
    }

    // Actions par défaut pour les propriétaires
    return [
      {
        title: 'Ajouter une Propriété',
        description: 'Créer une nouvelle propriété',
        icon: 'home',
        url: '/main/properties/create',
        color: 'primary'
      },
      {
        title: 'Ajouter une Chambre',
        description: 'Ajouter une chambre à louer',
        icon: 'door',
        url: '/main/room/create',
        color: 'success'
      }
    ];
  }
}
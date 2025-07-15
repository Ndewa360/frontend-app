import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { BehaviorSubject, Observable, timer } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';

import { MobileAuthStorageService, AuthTokens } from './mobile-auth-storage.service';
import { UserProfileAction } from '../../../shared/store';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MobileAutoLoginService {
  private readonly API_URL = environment.apiUrl;
  private isInitialized = false;
  private refreshTokenTimer: any;
  
  // Observable pour suivre l'état d'authentification
  private authStatusSubject = new BehaviorSubject<boolean>(false);
  public authStatus$ = this.authStatusSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private store: Store,
    private authStorage: MobileAuthStorageService
  ) {}

  /**
   * Initialiser le service d'auto-login au démarrage de l'app
   */
  async initializeAutoLogin(): Promise<boolean> {
    if (this.isInitialized) {
      return this.authStatusSubject.value;
    }

    console.log('🚀 Initialisation de l\'auto-login...');

    try {
      // Vérifier si l'utilisateur est connecté
      const isLoggedIn = await this.authStorage.isLoggedIn();
      
      if (isLoggedIn) {
        console.log('✅ Utilisateur déjà connecté');
        
        // Vérifier si le token doit être rafraîchi
        const shouldRefresh = await this.authStorage.shouldRefreshToken();
        
        if (shouldRefresh) {
          console.log('🔄 Rafraîchissement du token nécessaire');
          const refreshed = await this.refreshAccessToken();
          
          if (refreshed) {
            await this.loadUserProfile();
            this.startTokenRefreshTimer();
            this.authStatusSubject.next(true);
            this.isInitialized = true;
            return true;
          } else {
            // Échec du rafraîchissement, déconnecter
            await this.logout();
            return false;
          }
        } else {
          // Token encore valide
          await this.loadUserProfile();
          this.startTokenRefreshTimer();
          this.authStatusSubject.next(true);
          this.isInitialized = true;
          return true;
        }
      } else {
        console.log('❌ Utilisateur non connecté');
        this.authStatusSubject.next(false);
        this.isInitialized = true;
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation de l\'auto-login:', error);
      await this.logout();
      return false;
    }
  }

  /**
   * Sauvegarder les tokens après connexion
   */
  async saveLoginTokens(loginResponse: any): Promise<void> {
    const tokens: AuthTokens = {
      accessToken: loginResponse.accessToken,
      refreshToken: loginResponse.refreshToken,
      expiresAt: Date.now() + (loginResponse.expiresIn * 1000), // Convertir en timestamp
      userId: loginResponse.user.id
    };

    await this.authStorage.saveAuthTokens(tokens);
    
    // Mettre à jour le store avec les données utilisateur
    this.store.dispatch(new UserProfileAction.SetUserProfile(loginResponse.user));
    
    // Démarrer le timer de rafraîchissement
    this.startTokenRefreshTimer();
    
    // Mettre à jour le statut d'authentification
    this.authStatusSubject.next(true);
    
    console.log('✅ Connexion sauvegardée avec succès');
  }

  /**
   * Rafraîchir le token d'accès
   */
  async refreshAccessToken(): Promise<boolean> {
    try {
      const refreshToken = await this.authStorage.getRefreshToken();
      
      if (!refreshToken) {
        console.log('❌ Aucun refresh token disponible');
        return false;
      }

      console.log('🔄 Rafraîchissement du token...');

      const response = await this.http.post<any>(`${this.API_URL}/auth/refresh`, {
        refreshToken: refreshToken
      }).toPromise();

      if (response && response.accessToken) {
        // Mettre à jour le token d'accès
        const expiresAt = Date.now() + (response.expiresIn * 1000);
        await this.authStorage.updateAccessToken(response.accessToken, expiresAt);
        
        console.log('✅ Token rafraîchi avec succès');
        return true;
      } else {
        console.log('❌ Réponse invalide lors du rafraîchissement');
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur lors du rafraîchissement du token:', error);
      return false;
    }
  }

  /**
   * Charger le profil utilisateur
   */
  private async loadUserProfile(): Promise<void> {
    try {
      const userData = await this.authStorage.getUserData();
      if (userData) {
        // Charger le profil complet depuis l'API
        this.store.dispatch(new UserProfileAction.FetchUserProfile());
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement du profil:', error);
    }
  }

  /**
   * Démarrer le timer de rafraîchissement automatique
   */
  private startTokenRefreshTimer(): void {
    // Nettoyer le timer existant
    if (this.refreshTokenTimer) {
      clearInterval(this.refreshTokenTimer);
    }

    // Vérifier toutes les 4 minutes si le token doit être rafraîchi
    this.refreshTokenTimer = setInterval(async () => {
      const shouldRefresh = await this.authStorage.shouldRefreshToken();
      
      if (shouldRefresh) {
        console.log('⏰ Rafraîchissement automatique du token');
        const refreshed = await this.refreshAccessToken();
        
        if (!refreshed) {
          console.log('❌ Échec du rafraîchissement automatique - Déconnexion');
          await this.logout();
        }
      }
    }, 4 * 60 * 1000); // 4 minutes

    console.log('⏰ Timer de rafraîchissement démarré');
  }

  /**
   * Obtenir le token d'accès pour les requêtes API
   */
  async getAccessToken(): Promise<string | null> {
    return await this.authStorage.getAccessToken();
  }

  /**
   * Vérifier si l'utilisateur est connecté
   */
  async isLoggedIn(): Promise<boolean> {
    return await this.authStorage.isLoggedIn();
  }

  /**
   * Déconnexion complète
   */
  async logout(): Promise<void> {
    console.log('🚪 Déconnexion en cours...');
    
    // Nettoyer le timer
    if (this.refreshTokenTimer) {
      clearInterval(this.refreshTokenTimer);
      this.refreshTokenTimer = null;
    }

    // Supprimer les tokens
    await this.authStorage.clearAuthTokens();
    
    // Nettoyer le store
    this.store.dispatch(new UserProfileAction.Logout());
    
    // Mettre à jour le statut
    this.authStatusSubject.next(false);
    
    // Rediriger vers la page de connexion
    this.router.navigate(['/mobile/auth/login']);
    
    console.log('✅ Déconnexion terminée');
  }

  /**
   * Obtenir les headers d'authentification pour les requêtes
   */
  async getAuthHeaders(): Promise<HttpHeaders> {
    const token = await this.getAccessToken();
    
    if (token) {
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
    }
    
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  /**
   * Vérifier la validité du token avant une requête importante
   */
  async ensureValidToken(): Promise<boolean> {
    const isLoggedIn = await this.isLoggedIn();
    
    if (!isLoggedIn) {
      await this.logout();
      return false;
    }

    const shouldRefresh = await this.authStorage.shouldRefreshToken();
    
    if (shouldRefresh) {
      const refreshed = await this.refreshAccessToken();
      if (!refreshed) {
        await this.logout();
        return false;
      }
    }

    return true;
  }
}

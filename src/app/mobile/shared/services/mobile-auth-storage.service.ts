import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { Platform } from '@ionic/angular';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  userId: string;
}

@Injectable({
  providedIn: 'root'
})
export class MobileAuthStorageService {
  private storage: Storage | null = null;
  private readonly ACCESS_TOKEN_KEY = 'ndiye_access_token';
  private readonly REFRESH_TOKEN_KEY = 'ndiye_refresh_token';
  private readonly USER_DATA_KEY = 'ndiye_user_data';
  private readonly EXPIRES_AT_KEY = 'ndiye_expires_at';

  constructor(
    private ionicStorage: Storage,
    private platform: Platform
  ) {
    this.init();
  }

  /**
   * Initialiser le stockage
   */
  async init(): Promise<void> {
    this.storage = await this.ionicStorage.create();
  }

  /**
   * Sauvegarder les tokens d'authentification
   */
  async saveAuthTokens(tokens: AuthTokens): Promise<void> {
    await this.ensureStorageReady();
    
    await Promise.all([
      this.storage!.set(this.ACCESS_TOKEN_KEY, tokens.accessToken),
      this.storage!.set(this.REFRESH_TOKEN_KEY, tokens.refreshToken),
      this.storage!.set(this.EXPIRES_AT_KEY, tokens.expiresAt),
      this.storage!.set(this.USER_DATA_KEY, { userId: tokens.userId })
    ]);

    console.log('🔐 Tokens sauvegardés de manière sécurisée');
  }

  /**
   * Récupérer le token d'accès
   */
  async getAccessToken(): Promise<string | null> {
    await this.ensureStorageReady();
    return await this.storage!.get(this.ACCESS_TOKEN_KEY);
  }

  /**
   * Récupérer le token de rafraîchissement
   */
  async getRefreshToken(): Promise<string | null> {
    await this.ensureStorageReady();
    return await this.storage!.get(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Récupérer la date d'expiration
   */
  async getExpiresAt(): Promise<number | null> {
    await this.ensureStorageReady();
    return await this.storage!.get(this.EXPIRES_AT_KEY);
  }

  /**
   * Récupérer les données utilisateur
   */
  async getUserData(): Promise<any> {
    await this.ensureStorageReady();
    return await this.storage!.get(this.USER_DATA_KEY);
  }

  /**
   * Vérifier si l'utilisateur est connecté
   */
  async isLoggedIn(): Promise<boolean> {
    const accessToken = await this.getAccessToken();
    const expiresAt = await this.getExpiresAt();
    
    if (!accessToken || !expiresAt) {
      return false;
    }

    // Vérifier si le token n'est pas expiré
    const now = Date.now();
    return now < expiresAt;
  }

  /**
   * Vérifier si le token doit être rafraîchi
   */
  async shouldRefreshToken(): Promise<boolean> {
    const expiresAt = await this.getExpiresAt();
    
    if (!expiresAt) {
      return false;
    }

    // Rafraîchir si le token expire dans moins de 5 minutes
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    return (expiresAt - now) < fiveMinutes;
  }

  /**
   * Mettre à jour le token d'accès
   */
  async updateAccessToken(newToken: string, expiresAt: number): Promise<void> {
    await this.ensureStorageReady();
    
    await Promise.all([
      this.storage!.set(this.ACCESS_TOKEN_KEY, newToken),
      this.storage!.set(this.EXPIRES_AT_KEY, expiresAt)
    ]);

    console.log('🔄 Token d\'accès mis à jour');
  }

  /**
   * Supprimer tous les tokens (déconnexion)
   */
  async clearAuthTokens(): Promise<void> {
    await this.ensureStorageReady();
    
    await Promise.all([
      this.storage!.remove(this.ACCESS_TOKEN_KEY),
      this.storage!.remove(this.REFRESH_TOKEN_KEY),
      this.storage!.remove(this.EXPIRES_AT_KEY),
      this.storage!.remove(this.USER_DATA_KEY)
    ]);

    console.log('🚪 Tokens supprimés - Déconnexion');
  }

  /**
   * Obtenir tous les tokens
   */
  async getAllTokens(): Promise<AuthTokens | null> {
    const [accessToken, refreshToken, expiresAt, userData] = await Promise.all([
      this.getAccessToken(),
      this.getRefreshToken(),
      this.getExpiresAt(),
      this.getUserData()
    ]);

    if (!accessToken || !refreshToken || !expiresAt || !userData) {
      return null;
    }

    return {
      accessToken,
      refreshToken,
      expiresAt,
      userId: userData.userId
    };
  }

  /**
   * S'assurer que le stockage est prêt
   */
  private async ensureStorageReady(): Promise<void> {
    if (!this.storage) {
      await this.init();
    }
  }

  /**
   * Vérifier si on est sur un appareil mobile natif
   */
  isNativePlatform(): boolean {
    return this.platform.is('cordova') || this.platform.is('capacitor');
  }

  /**
   * Obtenir des informations sur l'appareil pour la sécurité
   */
  async getDeviceInfo(): Promise<any> {
    if (this.isNativePlatform()) {
      // Sur mobile natif, on peut obtenir plus d'infos
      return {
        platform: this.platform.platforms(),
        isNative: true,
        timestamp: Date.now()
      };
    } else {
      // Sur web, informations limitées
      return {
        userAgent: navigator.userAgent,
        isNative: false,
        timestamp: Date.now()
      };
    }
  }
}

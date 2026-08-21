import { Injectable } from '@angular/core';

/**
 * Service singleton léger utilisé pour signaler qu'une déconnexion volontaire
 * est en cours. Permet à l'intercepteur HTTP de ne pas tenter un refresh de token
 * sur les requêtes en vol qui reçoivent un 401 après le logout.
 */
@Injectable({ providedIn: 'root' })
export class LogoutFlagService {
  private static _isLoggingOut = false;

  static setLoggingOut(): void {
    this._isLoggingOut = true;
    // Reset automatique après 3s pour ne pas bloquer une reconnexion immédiate
    setTimeout(() => { this._isLoggingOut = false; }, 3000);
  }

  static isLoggingOut(): boolean {
    return this._isLoggingOut;
  }
}

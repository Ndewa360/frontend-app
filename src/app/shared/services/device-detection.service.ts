import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
  platform: string;
}

@Injectable({
  providedIn: 'root'
})
export class DeviceDetectionService {
  private deviceInfo: DeviceInfo;

  constructor(
    private router: Router
  ) {
    this.deviceInfo = this.detectDevice();
  }

  /**
   * Détecter le type d'appareil (version web uniquement)
   */
  private detectDevice(): DeviceInfo {
    const userAgent = navigator.userAgent.toLowerCase();
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Détection basée sur l'User Agent
    const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isTabletUA = /ipad|android(?!.*mobile)|tablet/i.test(userAgent);

    // Détection basée sur la taille d'écran
    const isMobileScreen = screenWidth <= 768;
    const isTabletScreen = screenWidth > 768 && screenWidth <= 1024;

    // Pour l'application web, utiliser une détection responsive
    const isMobile = isMobileUA && isMobileScreen;
    const isTablet = isTabletUA && isTabletScreen;
    const isDesktop = !isMobile && !isTablet;

    // Détection de la plateforme
    let platform = 'web';
    if (userAgent.includes('windows')) {
      platform = 'windows';
    } else if (userAgent.includes('mac')) {
      platform = 'mac';
    } else if (userAgent.includes('linux')) {
      platform = 'linux';
    }

    const deviceInfo: DeviceInfo = {
      isMobile,
      isTablet,
      isDesktop,
      userAgent,
      screenWidth,
      screenHeight,
      platform
    };

    console.log('📱 Détection d\'appareil (web):', deviceInfo);

    return deviceInfo;
  }





  /**
   * Obtenir les informations de l'appareil
   */
  getDeviceInfo(): DeviceInfo {
    return this.deviceInfo;
  }

  /**
   * Vérifier si c'est un appareil mobile
   */
  isMobile(): boolean {
    return this.deviceInfo.isMobile;
  }

  /**
   * Vérifier si c'est une tablette
   */
  isTablet(): boolean {
    return this.deviceInfo.isTablet;
  }

  /**
   * Vérifier si c'est un ordinateur de bureau
   */
  isDesktop(): boolean {
    return this.deviceInfo.isDesktop;
  }

  /**
   * Vérifier si c'est un appareil tactile
   */
  isTouchDevice(): boolean {
    return this.deviceInfo.isMobile || this.deviceInfo.isTablet;
  }

  /**
   * Obtenir la route par défaut (front office public)
   */
  getDefaultRoute(): string {
    console.log('🖥️ Application web -> /search/index (front office)');
    return '/search/index';
  }

  /**
   * Rediriger vers la route appropriée (application web)
   */
  redirectToAppropriateRoute(currentUrl?: string): void {
    const url = currentUrl || window.location.pathname;

    console.log('🔄 Redirection depuis:', url);

    // Si on est sur la racine, rediriger vers l'accueil
    if (url === '/' || url === '') {
      const defaultRoute = this.getDefaultRoute();
      console.log('➡️ Redirection vers:', defaultRoute);
      this.router.navigate([defaultRoute]);
      return;
    }

    console.log('✅ Aucune redirection nécessaire');
  }

  /**
   * Obtenir la classe CSS pour l'appareil
   */
  getDeviceClass(): string {
    if (this.isMobile()) {
      return 'device-mobile';
    } else if (this.isTablet()) {
      return 'device-tablet';
    } else {
      return 'device-desktop';
    }
  }

  /**
   * Écouter les changements de taille d'écran
   */
  onResize(): void {
    this.deviceInfo = this.detectDevice();
  }
}

import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
  platform: string;
  isNativeApp: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DeviceDetectionService {
  private deviceInfo: DeviceInfo;

  constructor(private router: Router) {
    this.deviceInfo = this.detectDevice();
  }

  /**
   * Détecter le type d'appareil
   */
  private detectDevice(): DeviceInfo {
    const userAgent = navigator.userAgent.toLowerCase();
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Vérifier si on est dans une application native (Cordova/Capacitor)
    const isNativeApp = !!(window as any).cordova || !!(window as any).Capacitor;

    // Détection basée sur l'User Agent
    const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isTabletUA = /ipad|android(?!.*mobile)|tablet/i.test(userAgent);

    // Détection basée sur la taille d'écran
    const isMobileScreen = screenWidth <= 768;
    const isTabletScreen = screenWidth > 768 && screenWidth <= 1024;
    const isDesktopScreen = screenWidth > 1024;

    // LOGIQUE CORRIGÉE: Ne rediriger vers mobile que pour les vraies apps natives
    let isMobile = false;
    let isTablet = false;
    let isDesktop = true; // Par défaut, considérer comme desktop (navigateur web)

    // Seulement si c'est une application native, utiliser la détection mobile
    if (isNativeApp) {
      if (isMobileUA || (isMobileScreen && !isTabletUA)) {
        isMobile = true;
        isDesktop = false;
      } else if (isTabletUA || (isTabletScreen && !isMobileUA)) {
        isTablet = true;
        isDesktop = false;
      }
    }
    // Sinon, rester sur desktop même si l'écran est petit (responsive web)

    // Détection de la plateforme
    let platform = 'web';
    if (userAgent.includes('android')) {
      platform = 'android';
    } else if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      platform = 'ios';
    } else if (userAgent.includes('windows')) {
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
      platform,
      isNativeApp
    };

    console.log('📱 Détection d\'appareil:', {
      ...deviceInfo,
      decision: isNativeApp ? 'App native détectée' : 'Navigateur web - pas de redirection mobile'
    });
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
   * Obtenir la route par défaut selon l'appareil
   */
  getDefaultRoute(): string {
    if (this.isMobile() || this.isTablet()) {
      return '/mobile/search';
    } else {
      return '/search/index'; // Route web par défaut
    }
  }

  /**
   * Rediriger vers la route appropriée selon l'appareil
   */
  redirectToAppropriateRoute(currentUrl?: string): void {
    const url = currentUrl || window.location.pathname;
    
    console.log('🔄 Redirection intelligente depuis:', url);

    // Si on est sur la racine, rediriger selon l'appareil
    if (url === '/' || url === '') {
      const defaultRoute = this.getDefaultRoute();
      console.log('➡️ Redirection vers:', defaultRoute);
      this.router.navigate([defaultRoute]);
      return;
    }

    // Si on est sur mobile/tablette mais sur une route web, rediriger vers mobile
    if (this.isTouchDevice() && !url.startsWith('/mobile')) {
      // Mapper les routes web vers mobile
      let mobileRoute = '/mobile/search';
      
      if (url.includes('/search')) {
        mobileRoute = '/mobile/search';
      } else if (url.includes('/auth')) {
        mobileRoute = '/mobile/auth/login';
      } else if (url.includes('/properties')) {
        mobileRoute = '/mobile/properties';
      } else if (url.includes('/contracts')) {
        mobileRoute = '/mobile/contracts';
      } else if (url.includes('/billing')) {
        mobileRoute = '/mobile/billing';
      }
      
      console.log('📱 Redirection mobile vers:', mobileRoute);
      this.router.navigate([mobileRoute]);
      return;
    }

    // Si on est sur desktop mais sur une route mobile, rediriger vers web
    if (this.isDesktop() && url.startsWith('/mobile')) {
      // Mapper les routes mobile vers web
      let webRoute = '/search/index';
      
      if (url.includes('/mobile/search')) {
        webRoute = '/search/index';
      } else if (url.includes('/mobile/auth')) {
        webRoute = '/auth/login';
      } else if (url.includes('/mobile/properties')) {
        webRoute = '/main/properties';
      } else if (url.includes('/mobile/contracts')) {
        webRoute = '/main/contracts';
      } else if (url.includes('/mobile/billing')) {
        webRoute = '/main/billing';
      }
      
      console.log('🖥️ Redirection web vers:', webRoute);
      this.router.navigate([webRoute]);
      return;
    }

    console.log('✅ Aucune redirection nécessaire');
  }

  /**
   * Forcer la redirection vers mobile
   */
  forceRedirectToMobile(): void {
    console.log('📱 Redirection forcée vers mobile');
    this.router.navigate(['/mobile/search']);
  }

  /**
   * Forcer la redirection vers web
   */
  forceRedirectToWeb(): void {
    console.log('🖥️ Redirection forcée vers web');
    this.router.navigate(['/home']);
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
    const newDeviceInfo = this.detectDevice();
    
    // Si le type d'appareil a changé, rediriger
    if (newDeviceInfo.isMobile !== this.deviceInfo.isMobile ||
        newDeviceInfo.isTablet !== this.deviceInfo.isTablet) {
      
      console.log('📐 Changement de taille d\'écran détecté');
      this.deviceInfo = newDeviceInfo;
      this.redirectToAppropriateRoute();
    } else {
      this.deviceInfo = newDeviceInfo;
    }
  }

  /**
   * Obtenir les préférences utilisateur stockées
   */
  getUserPreference(): 'mobile' | 'web' | null {
    return localStorage.getItem('ndiye-interface-preference') as 'mobile' | 'web' | null;
  }

  /**
   * Sauvegarder la préférence utilisateur
   */
  setUserPreference(preference: 'mobile' | 'web'): void {
    localStorage.setItem('ndiye-interface-preference', preference);
    console.log('💾 Préférence interface sauvegardée:', preference);
  }

  /**
   * Redirection avec prise en compte des préférences utilisateur
   */
  redirectWithUserPreference(): void {
    const userPreference = this.getUserPreference();
    
    if (userPreference === 'mobile') {
      this.forceRedirectToMobile();
    } else if (userPreference === 'web') {
      this.forceRedirectToWeb();
    } else {
      // Pas de préférence, utiliser la détection automatique
      this.redirectToAppropriateRoute();
    }
  }
}

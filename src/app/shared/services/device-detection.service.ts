import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Platform } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import { environment } from '../../../environments/environment';

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
  platform: string;
  isNativeApp: boolean;
  isAndroid: boolean;
  isIOS: boolean;
  isWeb: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DeviceDetectionService {
  private deviceInfo: DeviceInfo;

  constructor(
    private router: Router,
    private platform: Platform
  ) {
    this.deviceInfo = this.detectDevice();
  }

  /**
   * Détecter le type d'appareil avec logique améliorée
   */
  private detectDevice(): DeviceInfo {
    const userAgent = navigator.userAgent.toLowerCase();
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Vérifier si on est dans une application native (Capacitor)
    const isNativeApp = Capacitor.isNativePlatform();

    // Détection Ionic Platform
    const isAndroid = this.platform.is('android');
    const isIOS = this.platform.is('ios');
    const isWeb = this.platform.is('mobileweb') || this.platform.is('desktop');

    // Détection basée sur l'User Agent
    const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isTabletUA = /ipad|android(?!.*mobile)|tablet/i.test(userAgent);

    // Détection basée sur la taille d'écran
    const isMobileScreen = screenWidth <= 768;
    const isTabletScreen = screenWidth > 768 && screenWidth <= 1024;

    // LOGIQUE AMÉLIORÉE: Détection intelligente selon le contexte
    let isMobile = false;
    let isTablet = false;
    let isDesktop = false;

    if (isNativeApp) {
      // Dans l'app native, utiliser la détection Ionic
      isMobile = this.platform.is('mobile') || (isAndroid && !isTabletUA);
      isTablet = this.platform.is('tablet') || (isIOS && isTabletUA);
      isDesktop = false;
    } else {
      // Dans le navigateur, détecter selon l'appareil ET la route
      const currentUrl = window.location.pathname;

      if (currentUrl.startsWith('/mobile')) {
        // Sur route mobile : considérer comme mobile si appareil tactile
        isMobile = isMobileUA && isMobileScreen;
        isTablet = isTabletUA && isTabletScreen;
        isDesktop = !isMobile && !isTablet;
      } else {
        // Sur route web : toujours considérer comme desktop (responsive)
        isMobile = false;
        isTablet = false;
        isDesktop = true;
      }
    }

    // Détection de la plateforme
    let platform = 'web';
    if (isAndroid) {
      platform = 'android';
    } else if (isIOS) {
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
      isNativeApp,
      isAndroid,
      isIOS,
      isWeb
    };

    console.log('📱 Détection d\'appareil améliorée:', {
      ...deviceInfo,
      currentUrl: window.location.pathname,
      decision: this.getDetectionDecision(deviceInfo)
    });

    return deviceInfo;
  }

  /**
   * Obtenir la décision de détection pour les logs
   */
  private getDetectionDecision(info: DeviceInfo): string {
    if (info.isNativeApp) {
      return `App native ${info.platform}`;
    } else if (window.location.pathname.startsWith('/mobile')) {
      return `Navigateur sur route mobile - ${info.isMobile ? 'Mobile' : info.isTablet ? 'Tablette' : 'Desktop'}`;
    } else {
      return 'Navigateur sur route web - Mode responsive';
    }
  }

  /**
   * Rediriger vers le téléchargement de l'application
   */
  redirectToAppDownload(): void {
    const deviceInfo = this.getDeviceInfo();

    if (deviceInfo.isAndroid) {
      // Rediriger vers Google Play Store
      window.open('https://play.google.com/store/apps/details?id=com.ndiye.app', '_blank');
    } else if (deviceInfo.isIOS) {
      // Rediriger vers App Store
      window.open('https://apps.apple.com/app/ndiye/id123456789', '_blank');
    } else {
      // Pour les autres plateformes, rediriger vers une page de téléchargement générique
      window.open('/download-app', '_blank');
    }
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
    // Dans l'app native, toujours aller vers mobile
    if (this.deviceInfo.isNativeApp) {
      console.log('📱 App native détectée -> /mobile/search');
      return '/mobile/search';
    }

    // Dans le navigateur, détecter l'appareil
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const screenWidth = window.innerWidth;
    const isMobileScreen = screenWidth <= 768;

    // Si c'est un appareil mobile ET un petit écran, aller vers mobile
    if (isMobileDevice && isMobileScreen) {
      console.log('📱 Appareil mobile détecté -> /mobile/search');
      return '/mobile/search';
    } else {
      // Pour les desktops, aller vers l'app principale au lieu de search
      console.log('🖥️ Appareil desktop détecté -> /app/welcome');
      return '/app/welcome';
    }
  }

  /**
   * Rediriger vers la route appropriée selon l'appareil
   */
  redirectToAppropriateRoute(currentUrl?: string): void {
    const url = currentUrl || window.location.pathname;
    
    console.log('🔄 Redirection intelligente depuis:', url);

    // Si on est sur la racine, rediriger selon l'appareil
    if (url === '/' || url === '' || url === '/mobile' || url === '/mobile/') {
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
    console.log('🔄 redirectWithUserPreference appelée');
    console.log('📱 Info appareil:', this.deviceInfo);
    console.log('🌐 URL actuelle:', window.location.href);

    const userPreference = this.getUserPreference();
    console.log('👤 Préférence utilisateur:', userPreference);

    // Redirections automatiques réactivées avec logique améliorée
    console.log('✅ Redirections automatiques actives');

    if (userPreference === 'mobile') {
      console.log('➡️ Redirection forcée vers mobile');
      this.forceRedirectToMobile();
    } else if (userPreference === 'web') {
      console.log('➡️ Redirection forcée vers web');
      this.forceRedirectToWeb();
    } else {
      // Pas de préférence, utiliser la détection automatique
      console.log('➡️ Redirection automatique');
      this.redirectToAppropriateRoute();
    }
  }
}

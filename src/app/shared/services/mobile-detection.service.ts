import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MobileDetectionService {
  private isMobileSubject = new BehaviorSubject<boolean>(false);
  private isTabletSubject = new BehaviorSubject<boolean>(false);
  private platformSubject = new BehaviorSubject<string>('web');

  constructor(private platform: Platform) {
    this.detectPlatform();
  }

  /**
   * Détecter la plateforme et le type d'appareil
   */
  private detectPlatform(): void {
    // Détection via Ionic Platform
    const isMobileDevice = this.platform.is('mobile') || this.platform.is('mobileweb');
    const isTabletDevice = this.platform.is('tablet');
    
    // Détection via User Agent (fallback)
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isTabletUA = /ipad|android(?!.*mobile)/i.test(userAgent);
    
    // Détection via taille d'écran
    const screenWidth = window.innerWidth;
    const isMobileScreen = screenWidth <= 768;
    const isTabletScreen = screenWidth > 768 && screenWidth <= 1024;

    // Combinaison des détections
    const isMobile = isMobileDevice || (isMobileUA && isMobileScreen);
    const isTablet = isTabletDevice || (isTabletUA && isTabletScreen);

    this.isMobileSubject.next(isMobile);
    this.isTabletSubject.next(isTablet);

    // Déterminer la plateforme spécifique
    let platformType = 'web';
    if (this.platform.is('android')) {
      platformType = 'android';
    } else if (this.platform.is('ios')) {
      platformType = 'ios';
    } else if (isMobile) {
      platformType = 'mobile-web';
    } else if (isTablet) {
      platformType = 'tablet';
    }

    this.platformSubject.next(platformType);

    console.log('🔍 Détection de plateforme:', {
      isMobile,
      isTablet,
      platform: platformType,
      screenWidth,
      userAgent: userAgent.substring(0, 50) + '...'
    });
  }

  /**
   * Vérifier si l'appareil est mobile
   */
  get isMobile$(): Observable<boolean> {
    return this.isMobileSubject.asObservable();
  }

  /**
   * Vérifier si l'appareil est mobile (synchrone)
   */
  get isMobile(): boolean {
    return this.isMobileSubject.value;
  }

  /**
   * Vérifier si l'appareil est une tablette
   */
  get isTablet$(): Observable<boolean> {
    return this.isTabletSubject.asObservable();
  }

  /**
   * Vérifier si l'appareil est une tablette (synchrone)
   */
  get isTablet(): boolean {
    return this.isTabletSubject.value;
  }

  /**
   * Obtenir la plateforme
   */
  get platform$(): Observable<string> {
    return this.platformSubject.asObservable();
  }

  /**
   * Obtenir la plateforme (synchrone)
   */
  get currentPlatform(): string {
    return this.platformSubject.value;
  }

  /**
   * Vérifier si on est dans l'application native
   */
  get isNativeApp(): boolean {
    return this.platform.is('cordova') || this.platform.is('capacitor');
  }

  /**
   * Vérifier si on est sur le web
   */
  get isWeb(): boolean {
    return !this.isNativeApp;
  }

  /**
   * Obtenir les informations complètes de l'appareil
   */
  getDeviceInfo(): {
    isMobile: boolean;
    isTablet: boolean;
    isNative: boolean;
    platform: string;
    screenWidth: number;
    screenHeight: number;
    userAgent: string;
  } {
    return {
      isMobile: this.isMobile,
      isTablet: this.isTablet,
      isNative: this.isNativeApp,
      platform: this.currentPlatform,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      userAgent: navigator.userAgent
    };
  }

  /**
   * Vérifier si l'utilisateur devrait utiliser l'app mobile
   */
  shouldUseMobileApp(): boolean {
    return this.isMobile && this.isWeb;
  }

  /**
   * Obtenir le lien de téléchargement de l'app
   */
  getAppDownloadLink(): string {
    if (this.platform.is('android')) {
      return 'https://play.google.com/store/apps/details?id=com.ndiye.app';
    } else if (this.platform.is('ios')) {
      return 'https://apps.apple.com/app/ndiye/id123456789';
    }
    return 'https://ndiye.com/download';
  }

  /**
   * Rediriger vers le téléchargement de l'app
   */
  redirectToAppDownload(): void {
    const downloadLink = this.getAppDownloadLink();
    window.open(downloadLink, '_blank');
  }
}

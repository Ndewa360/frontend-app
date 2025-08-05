import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { DeviceDetectionService } from '../services/device-detection.service';

@Injectable({
  providedIn: 'root'
})
export class DeviceRedirectGuard implements CanActivate {

  constructor(
    private deviceService: DeviceDetectionService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {

    const currentUrl = state.url;
    console.log('🛡️ DeviceRedirectGuard - URL actuelle:', currentUrl);
    console.log('🛡️ DeviceRedirectGuard - Informations appareil:', this.deviceService.getDeviceInfo());

    // Si on est sur la racine, rediriger selon l'appareil
    if (currentUrl === '/' || currentUrl === '') {
      const defaultRoute = this.deviceService.getDefaultRoute();
      console.log('🔄 Redirection racine vers:', defaultRoute);

      // Utiliser setTimeout pour éviter les problèmes de timing
      setTimeout(() => {
        this.router.navigate([defaultRoute]);
      }, 0);

      return false;
    }

    // Éviter les redirections pour les routes d'administration et autres routes importantes
    if (currentUrl.startsWith('/app/') ||
        currentUrl.startsWith('/auth/') ||
        currentUrl.startsWith('/admin/') ||
        currentUrl.startsWith('/monitoring/') ||
        currentUrl.startsWith('/payment/')) {
      console.log('✅ Route protégée, pas de redirection:', currentUrl);
      return true;
    }

    // Vérifier si on doit rediriger selon l'appareil
    const deviceInfo = this.deviceService.getDeviceInfo();
    
    // Si on est sur mobile/tablette mais sur une route web
    if ((deviceInfo.isMobile || deviceInfo.isTablet) && !currentUrl.startsWith('/mobile')) {
      console.log('📱 Appareil tactile détecté, redirection vers mobile');
      this.redirectToMobileEquivalent(currentUrl);
      return false;
    }

    // Si on est sur desktop mais sur une route mobile
    if (deviceInfo.isDesktop && currentUrl.startsWith('/mobile')) {
      console.log('🖥️ Desktop détecté, redirection vers web');
      this.redirectToWebEquivalent(currentUrl);
      return false;
    }

    // Pas de redirection nécessaire
    console.log('✅ Aucune redirection nécessaire');
    return true;
  }

  /**
   * Rediriger vers l'équivalent mobile
   */
  private redirectToMobileEquivalent(webUrl: string): void {
    let mobileRoute = '/mobile/search';
    
    if (webUrl.includes('/search')) {
      mobileRoute = '/mobile/search';
    } else if (webUrl.includes('/auth/login')) {
      mobileRoute = '/mobile/auth/login';
    } else if (webUrl.includes('/auth/register')) {
      mobileRoute = '/mobile/auth/register';
    } else if (webUrl.includes('/auth')) {
      mobileRoute = '/mobile/auth/login';
    } else if (webUrl.includes('/app/properties')) {
      mobileRoute = '/mobile/properties';
    } else if (webUrl.includes('/app/contracts')) {
      mobileRoute = '/mobile/contracts';
    } else if (webUrl.includes('/app/billing')) {
      mobileRoute = '/mobile/billing';
    } else if (webUrl.includes('/user-profile')) {
      mobileRoute = '/mobile/profile';
    }
    
    console.log('📱 Redirection mobile:', webUrl, '->', mobileRoute);
    this.router.navigate([mobileRoute]);
  }

  /**
   * Rediriger vers l'équivalent web
   */
  private redirectToWebEquivalent(mobileUrl: string): void {
    let webRoute = '/search/index';
    
    if (mobileUrl.includes('/mobile/search')) {
      webRoute = '/search/index';
    } else if (mobileUrl.includes('/mobile/auth/login')) {
      webRoute = '/auth/login';
    } else if (mobileUrl.includes('/mobile/auth/register')) {
      webRoute = '/auth/register';
    } else if (mobileUrl.includes('/mobile/auth')) {
      webRoute = '/auth/login';
    } else if (mobileUrl.includes('/mobile/properties')) {
      webRoute = '/app/properties';
    } else if (mobileUrl.includes('/mobile/contracts')) {
      webRoute = '/app/contracts';
    } else if (mobileUrl.includes('/mobile/billing')) {
      webRoute = '/app/billing';
    } else if (mobileUrl.includes('/mobile/profile')) {
      webRoute = '/user-profile';
    }
    
    console.log('🖥️ Redirection web:', mobileUrl, '->', webRoute);
    this.router.navigate([webRoute]);
  }
}

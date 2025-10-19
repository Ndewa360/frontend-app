import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ContentReadyService {
  private contentReadySubject = new BehaviorSubject<boolean>(false);
  public contentReady$ = this.contentReadySubject.asObservable();

  private checkInterval: any;
  private maxChecks = 50; // Maximum 5 secondes (50 * 100ms)
  private currentChecks = 0;

  constructor(private router: Router) {
    // Écouter les changements de route pour réinitialiser l'état
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.resetContentReady();
    });
  }

  /**
   * Démarre la vérification du contenu
   */
  public startContentCheck(): void {
    console.log('🔍 ContentReadyService - Démarrage de la vérification du contenu');
    this.currentChecks = 0;
    this.contentReadySubject.next(false);
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(() => {
      this.checkContentReady();
    }, 100);
  }

  /**
   * Vérifie si le contenu Angular est prêt
   */
  private checkContentReady(): void {
    this.currentChecks++;
    
    const appRoot = document.querySelector('app-root');
    const routerOutlet = document.querySelector('router-outlet');
    
    // Vérifications multiples pour s'assurer que le contenu est vraiment rendu
    const hasAppContent = appRoot && appRoot.children.length > 1;
    const hasRouterContent = routerOutlet && routerOutlet.nextElementSibling;
    const hasVisibleElements = document.querySelectorAll('[ng-reflect-router-outlet], .layout-container, .main-content').length > 0;
    
    const isContentReady = hasAppContent || hasRouterContent || hasVisibleElements;
    
    if (isContentReady) {
      console.log('✅ ContentReadyService - Contenu prêt détecté');
      this.setContentReady(true);
    } else if (this.currentChecks >= this.maxChecks) {
      console.log('⚠️ ContentReadyService - Timeout atteint, considérant le contenu comme prêt');
      this.setContentReady(true);
    }
  }

  /**
   * Marque le contenu comme prêt
   */
  private setContentReady(ready: boolean): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    this.contentReadySubject.next(ready);
  }

  /**
   * Réinitialise l'état pour une nouvelle route
   */
  private resetContentReady(): void {
    console.log('🔄 ContentReadyService - Réinitialisation pour nouvelle route');
    this.currentChecks = 0;
    this.contentReadySubject.next(false);
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Force le contenu comme prêt (pour les cas d'urgence)
   */
  public forceContentReady(): void {
    console.log('🚨 ContentReadyService - Contenu forcé comme prêt');
    this.setContentReady(true);
  }

  /**
   * Retourne l'état actuel du contenu
   */
  public isContentReady(): boolean {
    return this.contentReadySubject.value;
  }

  /**
   * Attend que le contenu soit prêt avec une promesse
   */
  public waitForContent(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.isContentReady()) {
        resolve(true);
        return;
      }

      const subscription = this.contentReady$.subscribe(ready => {
        if (ready) {
          subscription.unsubscribe();
          resolve(true);
        }
      });

      // Timeout de sécurité
      setTimeout(() => {
        subscription.unsubscribe();
        resolve(true);
      }, 5000);
    });
  }
}
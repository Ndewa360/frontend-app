import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MobileDetectionService } from '../services/mobile-detection.service';
import { MobileDashboardWarningComponent } from '../components/mobile-dashboard-warning/mobile-dashboard-warning.component';

@Injectable({
  providedIn: 'root'
})
export class MobileDashboardGuard implements CanActivate {

  constructor(
    private mobileDetectionService: MobileDetectionService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    // Si ce n'est pas un appareil mobile, autoriser l'accès
    if (!this.mobileDetectionService.isMobile) {
      return true;
    }

    // Si c'est l'app native, autoriser l'accès
    if (this.mobileDetectionService.isNativeApp) {
      return true;
    }

    // Si c'est mobile web, afficher l'avertissement
    this.showMobileWarning(state.url);
    return false;
  }

  /**
   * Afficher l'avertissement pour mobile
   */
  private showMobileWarning(attemptedUrl: string): void {
    const dialogRef = this.dialog.open(MobileDashboardWarningComponent, {
      width: '90vw',
      maxWidth: '400px',
      disableClose: true,
      data: {
        attemptedUrl,
        deviceInfo: this.mobileDetectionService.getDeviceInfo()
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'download') {
        this.mobileDetectionService.redirectToAppDownload();
      } else if (result === 'continue') {
        // L'utilisateur insiste pour continuer sur mobile web
        // On peut soit rediriger vers une version mobile simplifiée
        // soit permettre l'accès avec un avertissement
        this.router.navigate(['/mobile-dashboard']);
      } else {
        // Rediriger vers la page d'accueil
        this.router.navigate(['/']);
      }
    });
  }
}

import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MobileDetectionService } from '../../services/mobile-detection.service';

export interface MobileWarningData {
  attemptedUrl: string;
  deviceInfo: any;
}

@Component({
  selector: 'app-mobile-dashboard-warning',
  templateUrl: './mobile-dashboard-warning.component.html',
  styleUrls: ['./mobile-dashboard-warning.component.scss']
})
export class MobileDashboardWarningComponent {

  constructor(
    public dialogRef: MatDialogRef<MobileDashboardWarningComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MobileWarningData,
    private mobileDetectionService: MobileDetectionService
  ) {}

  /**
   * Télécharger l'application
   */
  downloadApp(): void {
    this.mobileDetectionService.redirectToAppDownload();
    this.dialogRef.close('download');
  }

  /**
   * Continuer sur le web (non recommandé)
   */
  continueOnWeb(): void {
    this.dialogRef.close('continue');
  }

  /**
   * Retourner à l'accueil
   */
  goHome(): void {
    this.dialogRef.close('home');
  }

  /**
   * Obtenir le nom de la plateforme
   */
  getPlatformName(): string {
    const platform = this.data.deviceInfo.platform;
    switch (platform) {
      case 'android':
        return 'Android';
      case 'ios':
        return 'iOS';
      default:
        return 'Mobile';
    }
  }

  /**
   * Obtenir l'icône de la plateforme
   */
  getPlatformIcon(): string {
    const platform = this.data.deviceInfo.platform;
    switch (platform) {
      case 'android':
        return 'fab fa-android';
      case 'ios':
        return 'fab fa-apple';
      default:
        return 'fas fa-mobile-alt';
    }
  }
}

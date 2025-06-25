import { Component, Input } from '@angular/core';
import { RoomModel, LocataireModel } from 'src/app/shared/store';

@Component({
  selector: 'app-unit-tenant-tab',
  templateUrl: './unit-tenant-tab.component.html',
  styleUrls: ['./unit-tenant-tab.component.scss']
})
export class UnitTenantTabComponent {
  @Input() room: RoomModel | null = null;
  @Input() tenant: LocataireModel | null = null;

  getTenantName(): string {
    if (!this.tenant) return 'N/A';
    return this.tenant.fullName || this.tenant.name || 'Locataire';
  }

  hasReferenceInfo(): boolean {
    return !!(this.tenant?.fullNameRef || this.tenant?.emailRef || this.tenant?.phoneNumberRef);
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}

import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { TenantAvatarService } from '../../services/tenant-avatar.service';

@Component({
  selector: 'app-tenant-avatar',
  templateUrl: './tenant-avatar.component.html',
  styleUrls: ['./tenant-avatar.component.scss']
})
export class TenantAvatarComponent implements OnInit, OnChanges {

  @Input() tenant: any;
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() showStatus: boolean = false;
  @Input() status: 'active' | 'inactive' | 'pending' = 'active';
  @Input() clickable: boolean = false;

  avatarData: any;

  constructor(private tenantAvatarService: TenantAvatarService) { }

  ngOnInit(): void {
    this.avatarData = this.tenantAvatarService.getTenantAvatarData(this.tenant);
  }

  ngOnChanges(): void {
    if (this.tenant) {
      this.avatarData = this.tenantAvatarService.getTenantAvatarData(this.tenant);
    }
  }

  getSizeClasses(): string {
    const sizeMap = {
      'sm': 'w-8 h-8 text-sm',
      'md': 'w-12 h-12 text-base',
      'lg': 'w-16 h-16 text-lg',
      'xl': 'w-24 h-24 text-2xl'
    };
    return sizeMap[this.size];
  }

  getStatusClasses(): string {
    const statusMap = {
      'active': 'bg-emerald-500',
      'inactive': 'bg-red-500',
      'pending': 'bg-amber-500'
    };
    return statusMap[this.status];
  }

  getStatusSize(): string {
    const sizeMap = {
      'sm': 'w-2 h-2',
      'md': 'w-3 h-3',
      'lg': 'w-4 h-4',
      'xl': 'w-5 h-5'
    };
    return sizeMap[this.size];
  }

  onAvatarClick(): void {
    if (this.clickable) {
      // Émettre un événement ou naviguer
      console.log('Avatar cliqué:', this.tenant);
    }
  }
}

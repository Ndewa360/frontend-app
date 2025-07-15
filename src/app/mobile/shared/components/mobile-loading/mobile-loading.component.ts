import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-mobile-loading',
  templateUrl: './mobile-loading.component.html',
  styleUrls: ['./mobile-loading.component.scss']
})
export class MobileLoadingComponent {
  @Input() message = 'Chargement...';
  @Input() spinner: 'bubbles' | 'circles' | 'circular' | 'crescent' | 'dots' | 'lines' | 'lines-small' = 'crescent';
  @Input() color: 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'danger' | 'light' | 'medium' | 'dark' = 'primary';
  @Input() size: 'small' | 'default' | 'large' = 'default';
}

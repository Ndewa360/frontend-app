import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-mobile-map-view',
  template: `
    <div class="map-container">
      <p>Vue carte à implémenter</p>
    </div>
  `,
  styles: [`
    .map-container {
      height: 300px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f0f0f0;
      border-radius: 8px;
    }
  `]
})
export class MobileMapViewComponent {
  @Input() units: any[] = [];
}

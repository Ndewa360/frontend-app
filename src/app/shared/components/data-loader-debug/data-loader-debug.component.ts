import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DataDrivenLoaderService, PageLoadingState } from '../../services/data-driven-loader.service';

@Component({
  selector: 'app-data-loader-debug',
  template: `
    <div class="data-loader-debug" *ngIf="currentState">
      <div class="debug-header">
        <h4>🔍 Debug Loader Basé sur les Données</h4>
        <button (click)="toggleExpanded()" class="toggle-btn">
          {{ isExpanded ? '▼' : '▶' }}
        </button>
      </div>
      
      <div class="debug-content" *ngIf="isExpanded">
        <div class="state-info">
          <div class="info-row">
            <span class="label">Route:</span>
            <span class="value">{{ currentState.route }}</span>
          </div>
          
          <div class="info-row">
            <span class="label">État:</span>
            <span class="value" [class]="currentState.isLoading ? 'loading' : 'loaded'">
              {{ currentState.isLoading ? '🔄 Chargement' : '✅ Terminé' }}
            </span>
          </div>
          
          <div class="info-row">
            <span class="label">Progression:</span>
            <span class="value">{{ currentState.progress || 0 }}%</span>
          </div>
          
          <div class="info-row">
            <span class="label">Message:</span>
            <span class="value">{{ currentState.message }}</span>
          </div>
        </div>
        
        <div class="data-progress">
          <h5>Données Requises ({{ currentState.requiredData.length }}):</h5>
          <div class="data-list">
            <div *ngFor="let data of currentState.requiredData" 
                 class="data-item"
                 [class.loaded]="isDataLoaded(data)">
              <span class="data-icon">{{ isDataLoaded(data) ? '✅' : '⏳' }}</span>
              <span class="data-name">{{ data }}</span>
            </div>
          </div>
        </div>
        
        <div class="progress-bar">
          <div class="progress-fill" 
               [style.width.%]="currentState.progress || 0">
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .data-loader-debug {
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      border-radius: 8px;
      padding: 12px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      z-index: 10000;
      min-width: 300px;
      max-width: 400px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
    
    .debug-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    
    .debug-header h4 {
      margin: 0;
      font-size: 14px;
      font-weight: bold;
    }
    
    .toggle-btn {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 16px;
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
    }
    
    .label {
      font-weight: bold;
      color: #ccc;
    }
    
    .value {
      color: white;
    }
    
    .value.loading {
      color: #ffa500;
    }
    
    .value.loaded {
      color: #00ff00;
    }
    
    .data-progress {
      margin-top: 12px;
    }
    
    .data-progress h5 {
      margin: 0 0 8px 0;
      font-size: 12px;
      color: #ccc;
    }
    
    .data-list {
      max-height: 120px;
      overflow-y: auto;
    }
    
    .data-item {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
      padding: 2px 4px;
      border-radius: 4px;
    }
    
    .data-item.loaded {
      background: rgba(0, 255, 0, 0.1);
    }
    
    .data-icon {
      font-size: 14px;
    }
    
    .data-name {
      font-size: 11px;
      word-break: break-all;
    }
    
    .progress-bar {
      margin-top: 12px;
      height: 6px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 3px;
      overflow: hidden;
    }
    
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #ffa500, #00ff00);
      transition: width 0.3s ease;
    }
  `]
})
export class DataLoaderDebugComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  currentState: PageLoadingState | null = null;
  isExpanded = true;

  constructor(private dataDrivenLoader: DataDrivenLoaderService) {}

  ngOnInit(): void {
    // Observer l'état du loader
    this.dataDrivenLoader.pageLoading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.currentState = state;
        console.log('🔍 Debug Loader - État mis à jour:', state);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleExpanded(): void {
    this.isExpanded = !this.isExpanded;
  }

  isDataLoaded(dataKey: string): boolean {
    return this.currentState?.loadedData.includes(dataKey) || false;
  }
}

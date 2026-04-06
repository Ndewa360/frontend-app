import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NavigationLoaderService } from '../../services/navigation-loader.service';
import { DataDrivenLoaderService } from '../../services/data-driven-loader.service';

@Component({
  selector: 'app-nav-progress-bar',
  template: `
    <div class="npb" [class.npb--visible]="visible" [class.npb--complete]="complete">
      <div class="npb__bar" [style.width.%]="progress"></div>
      <div class="npb__spinner" *ngIf="visible && !complete"></div>
    </div>
  `,
  styles: [`
    .npb {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 9999;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    .npb--visible { opacity: 1; }
    .npb--complete { opacity: 0; transition: opacity 0.4s ease 0.1s; }

    .npb__bar {
      height: 3px;
      background: linear-gradient(90deg, rgb(204, 140, 10), #fadc4d);
      box-shadow: 0 0 8px rgba(204, 140, 10, 0.6);
      transition: width 0.3s ease;
      border-radius: 0 2px 2px 0;
    }

    .npb__spinner {
      position: absolute;
      top: 6px;
      right: 12px;
      width: 16px;
      height: 16px;
      border: 2px solid transparent;
      border-top-color: rgb(204, 140, 10);
      border-radius: 50%;
      animation: npb-spin 0.6s linear infinite;
    }

    @keyframes npb-spin { to { transform: rotate(360deg); } }
  `]
})
export class NavProgressBarComponent implements OnInit, OnDestroy {
  visible = false;
  complete = false;
  progress = 0;

  private destroy$ = new Subject<void>();
  private progressTimer: any;

  constructor(
    private navLoader: NavigationLoaderService,
    private dataLoader: DataDrivenLoaderService,
  ) {}

  ngOnInit(): void {
    // Barre de progression pilotée par la navigation ET les stores
    this.navLoader.loading$.pipe(takeUntil(this.destroy$)).subscribe(loading => {
      if (loading) {
        this.startProgress();
      }
    });

    this.dataLoader.pageLoading$.pipe(takeUntil(this.destroy$)).subscribe(state => {
      if (!state) return;

      if (state.isLoading) {
        this.visible = true;
        this.complete = false;
        // Synchroniser la progression avec les stores
        this.progress = Math.max(this.progress, state.progress || 10);
      } else {
        // Chargement terminé — compléter la barre
        this.completeProgress();
      }
    });

    this.dataLoader.globalLoaderVisible$.pipe(takeUntil(this.destroy$)).subscribe(visible => {
      if (!visible && this.visible) {
        this.completeProgress();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    clearInterval(this.progressTimer);
  }

  private startProgress(): void {
    clearInterval(this.progressTimer);
    this.visible = true;
    this.complete = false;
    this.progress = 5;

    // Progression simulée qui ralentit à l'approche de 90%
    this.progressTimer = setInterval(() => {
      if (this.progress < 90) {
        const increment = this.progress < 30 ? 8 : this.progress < 60 ? 4 : 1;
        this.progress = Math.min(90, this.progress + increment);
      }
    }, 200);
  }

  private completeProgress(): void {
    clearInterval(this.progressTimer);
    this.progress = 100;
    this.complete = true;

    setTimeout(() => {
      this.visible = false;
      this.complete = false;
      this.progress = 0;
    }, 500);
  }
}

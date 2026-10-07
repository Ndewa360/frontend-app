import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  Router,
  NavigationStart,
  NavigationEnd,
  NavigationCancel,
  NavigationError
} from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DataDrivenLoaderService } from '../../services/data-driven-loader.service';
import { NgIf } from '@angular/common';

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
  `],
  standalone: true,
  imports: [NgIf]
})
export class NavProgressBarComponent implements OnInit, OnDestroy {
  visible = false;
  complete = false;
  progress = 0;

  private destroy$ = new Subject<void>();
  private progressTimer: any;
  private pendingShowTimer: any;
  // Compteur partagé entre les deux sources (overlay données + navigation) pour
  // que la barre reste visible tant que l'une des deux est active.
  private activeCount = 0;

  constructor(
    private dataLoader: DataDrivenLoaderService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Source 1 : l'overlay Angular (stores en attente de données).
    this.dataLoader.overlayVisible$.pipe(takeUntil(this.destroy$)).subscribe(visible => {
      if (visible) {
        this.show();
      } else {
        this.hide();
      }
    });

    // Source 2 : chaque navigation Angular (chargement de chunk lazy, resolver,
    // rendu), pour couvrir le temps mort au clic sur un bouton/lien vers une
    // route publique non couverte par l'overlay. Une légère temporisation évite
    // la barre sur les navigations quasi instantanées (chunk en cache).
    this.router.events.pipe(takeUntil(this.destroy$)).subscribe(event => {
      if (event instanceof NavigationStart) {
        clearTimeout(this.pendingShowTimer);
        this.pendingShowTimer = setTimeout(() => this.show(), 200);
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        clearTimeout(this.pendingShowTimer);
        this.hide();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    clearInterval(this.progressTimer);
    clearTimeout(this.pendingShowTimer);
  }

  private show(): void {
    this.activeCount++;
    if (this.visible) return;
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

  private hide(): void {
    this.activeCount = Math.max(0, this.activeCount - 1);
    if (this.activeCount > 0) return;
    this.completeProgress();
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
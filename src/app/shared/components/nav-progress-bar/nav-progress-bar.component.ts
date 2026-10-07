import { Component, OnInit, OnDestroy } from '@angular/core';
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

  constructor(private dataLoader: DataDrivenLoaderService) {}

  ngOnInit(): void {
    // Une seule source de vérité : la visibilité de l'overlay Angular.
    //
    // Avant, la barre était aussi pilotée par `NavigationLoaderService`, ce qui
    // la démarrait à CHAQUE NavigationStart — y compris sur les navigations où
    // aucun store n'est en attente. Résultat : une barre orange clignotante en
    // haut de chaque page, sans rapport avec une réelle attente de données.
    // `pageLoading$` était en plus un BehaviorSubject jamais émis (abonnement mort).
    this.dataLoader.overlayVisible$.pipe(takeUntil(this.destroy$)).subscribe(visible => {
      if (visible) {
        this.startProgress();
      } else if (this.visible) {
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

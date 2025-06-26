import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LoadingState, LoadingStateService } from '../../services/loading-state.service';

@Component({
  selector: 'app-loading-overlay',
  templateUrl: './loading-overlay.component.html',
  styleUrls: ['./loading-overlay.component.scss']
})
export class LoadingOverlayComponent implements OnInit, OnDestroy {
  @Input() loadingState$: Observable<LoadingState>;
  @Input() showOverlay = true;
  @Input() showProgress = false;
  @Input() customMessage: string;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() theme: 'light' | 'dark' = 'light';

  currentLoadingState: LoadingState = { isLoading: false };
  private destroy$ = new Subject<void>();

  constructor(private loadingStateService: LoadingStateService) {}

  ngOnInit(): void {
    if (this.loadingState$) {
      this.loadingState$
        .pipe(takeUntil(this.destroy$))
        .subscribe(state => {
          this.currentLoadingState = state;
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get displayMessage(): string {
    return this.customMessage || this.currentLoadingState.loadingMessage || 'Chargement en cours...';
  }

  get showProgressBar(): boolean {
    return this.showProgress && this.currentLoadingState.progress !== undefined;
  }

  get progressValue(): number {
    return this.currentLoadingState.progress || 0;
  }

  get spinnerSize(): string {
    switch (this.size) {
      case 'small': return 'w-6 h-6';
      case 'large': return 'w-12 h-12';
      default: return 'w-8 h-8';
    }
  }

  get containerClasses(): string {
    const baseClasses = 'loading-overlay flex flex-col items-center justify-center';
    const themeClasses = this.theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900';
    const overlayClasses = this.showOverlay ? 'absolute inset-0 z-50' : 'relative';
    
    return `${baseClasses} ${themeClasses} ${overlayClasses}`;
  }
}

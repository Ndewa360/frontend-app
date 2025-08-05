import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { NavigationLoaderService } from '../../services/navigation-loader.service';
import { ibmIconSizeType } from 'src/@youpez/components/ibm-icon/ibm-icon.component';

@Component({
  selector: 'app-navigation-button',
  templateUrl: './navigation-button.component.html',
  styleUrls: ['./navigation-button.component.scss']
})
export class NavigationButtonComponent implements OnInit, OnDestroy {
  @Input() route: string = '';
  @Input() icon: string = '';
  @Input() label: string = '';
  @Input() tooltip: string = '';
  @Input() buttonClass: string = '';
  @Input() iconSize: ibmIconSizeType = '24';
  @Input() disabled: boolean = false;

  isLoading: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private navigationLoader: NavigationLoaderService
  ) {}

  ngOnInit(): void {
    // Écouter l'état de navigation pour cette route spécifique
    this.navigationLoader.isLoadingRoute(this.route)
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.isLoading = loading;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Gère le clic sur le bouton de navigation
   */
  onNavigate(): void {
    if (this.disabled || this.isLoading) {
      return;
    }

    // Démarrer le loader manuellement pour un feedback immédiat
    this.navigationLoader.startLoading(this.route);
    
    // Naviguer vers la route
    this.router.navigate([this.route]);
  }
}

import { Component, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Classe de base pour éviter les fuites mémoire
 * Tous les composants devraient hériter de cette classe
 */
@Component({
  template: ''
})
export abstract class BaseComponent implements OnDestroy {
  protected destroy$ = new Subject<void>();

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

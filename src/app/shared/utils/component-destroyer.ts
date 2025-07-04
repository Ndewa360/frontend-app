import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Classe utilitaire pour gérer la destruction des observables
 * Évite les fuites mémoire en s'assurant que tous les observables sont détruits
 */
@Injectable()
export class ComponentDestroyer implements OnDestroy {
  private readonly destroy$ = new Subject<void>();

  /**
   * Observable qui émet lors de la destruction du composant
   */
  get onDestroy$() {
    return this.destroy$.asObservable();
  }

  /**
   * Méthode appelée automatiquement lors de la destruction du composant
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

/**
 * Mixin pour ajouter la fonctionnalité de destruction aux composants
 * Usage: export class MyComponent extends ComponentDestroyerMixin(Component) {}
 */
export function ComponentDestroyerMixin<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends Base implements OnDestroy {
    private readonly destroy$ = new Subject<void>();

    get onDestroy$() {
      return this.destroy$.asObservable();
    }

    ngOnDestroy(): void {
      this.destroy$.next();
      this.destroy$.complete();
      
      // Appeler ngOnDestroy de la classe parent si elle existe
      if (super.ngOnDestroy) {
        super.ngOnDestroy();
      }
    }
  };
}

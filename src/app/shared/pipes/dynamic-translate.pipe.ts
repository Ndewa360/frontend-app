import { Pipe, PipeTransform, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

/**
 * Pipe pour les traductions dynamiques qui se mettent à jour automatiquement
 * lors du changement de langue
 */
@Pipe({
  name: 'dynamicTranslate',
  pure: false // Important pour que le pipe se mette à jour lors du changement de langue
})
export class DynamicTranslatePipe implements PipeTransform, OnDestroy {
  
  private lastKey: string = '';
  private lastParams: any = {};
  private lastValue: string = '';
  private subscription?: Subscription;

  constructor(
    private translate: TranslateService,
    private cdr: ChangeDetectorRef
  ) {}

  transform(key: string, params?: any): string {
    if (!key) return '';

    // Si la clé ou les paramètres ont changé, ou si c'est la première fois
    if (key !== this.lastKey || JSON.stringify(params) !== JSON.stringify(this.lastParams)) {
      this.lastKey = key;
      this.lastParams = params;
      this.updateValue();
      
      // S'abonner aux changements de langue si ce n'est pas déjà fait
      if (!this.subscription) {
        this.subscription = this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
          this.updateValue();
          this.cdr.markForCheck();
        });
      }
    }

    return this.lastValue;
  }

  private updateValue(): void {
    this.lastValue = this.translate.instant(this.lastKey, this.lastParams);
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}

import { Component, Input } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';
import { currentAppLanguage } from '../../services/localization/app-locale';
import {
  FREE_MAX_OCCUPIED_UNITS,
  FREE_MAX_PROPERTIES,
  GOLD_THRESHOLD,
  MIN_OCCUPATION_DAYS,
  PRICING_CONTACT,
  PRO_BRACKETS,
  PricingSummary,
  PricingTier,
  formatFcfa,
} from '../../pricing/pricing-grid';

/**
 * Grille « Gratuit / Pro / Gold » avec le palier du compte mis en évidence.
 * Sans `summary`, affiche la grille seule (aucune ligne active).
 */
@Component({
  selector: 'app-pricing-tiers',
  templateUrl: './pricing-tiers.component.html',
  styleUrls: ['./pricing-tiers.component.scss'],
  standalone: true,
  imports: [NgFor, NgIf, NgClass, RouterLink, TranslatePipe],
})
export class PricingTiersComponent {
  @Input() summary: PricingSummary | null = null;
  /** Version réduite (modale) : sans l'encart de situation ni les contacts. */
  @Input() compact = false;
  /** Palier à mettre en évidence à la place du palier actuel (aperçu). */
  @Input() highlightTier: PricingTier | null = null;

  readonly brackets = PRO_BRACKETS;
  readonly contact = PRICING_CONTACT;
  readonly freeMaxProperties = FREE_MAX_PROPERTIES;
  readonly freeMaxUnits = FREE_MAX_OCCUPIED_UNITS;
  readonly goldThreshold = GOLD_THRESHOLD;
  readonly minDays = MIN_OCCUPATION_DAYS;
  readonly fcfa = formatFcfa;

  get activeTier(): PricingTier | null {
    return this.highlightTier ?? this.summary?.tier ?? null;
  }

  isActive(tier: PricingTier): boolean {
    return this.activeTier === tier;
  }

  get mailtoLink(): string {
    return `mailto:${this.contact.email}?subject=${encodeURIComponent('Offre Gold Ndewa360')}`;
  }

  /**
   * Nouveau message Gmail pré-rempli, ouvert dans un nouvel onglet. Le lien
   * `mailto:` seul n'ouvre rien quand aucun logiciel de messagerie n'est
   * configuré sur l'appareil (cas fréquent sur ordinateur).
   */
  get gmailComposeLink(): string {
    const params = new URLSearchParams({ view: 'cm', fs: '1', to: this.contact.email, su: 'Offre Gold Ndewa360' });
    return `https://mail.google.com/mail/?${params.toString()}`;
  }

  /** Page de contact du site, dans la langue courante. */
  get contactPageLink(): string[] {
    return ['/', currentAppLanguage(), 'home', 'contact'];
  }
}

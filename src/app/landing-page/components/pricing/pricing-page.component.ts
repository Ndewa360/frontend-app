import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageUrlService } from 'src/app/shared/services/language-url.service';
import {
  FREE_MAX_OCCUPIED_UNITS, GOLD_THRESHOLD, MIN_OCCUPATION_DAYS, PRICING_CONTACT, PRO_BRACKETS,
  TRIAL_DURATION_DAYS, formatFcfa,
} from 'src/app/shared/pricing/pricing-grid';

export type PricingProfile = 'proprietaire' | 'agent' | 'chercheur';

/**
 * Page « Tarifs » : les tarifs dépendent du profil (propriétaire, agent,
 * chercheur de logement). Le lien « Tarifs » renvoyait sur l'accueil, dont
 * la section tarifs ne concerne que les propriétaires.
 *
 * Profil choisi dans l'adresse (?profil=agent) pour pouvoir partager un lien
 * direct. Montants issus de la grille partagée avec la facturation
 * (pricing-grid.ts), jamais saisis en dur. Titre et description pour les
 * moteurs de recherche : SeoService (route /home/tarifs).
 */
@Component({
  selector: 'app-pricing-page',
  templateUrl: './pricing-page.component.html',
  styleUrls: ['./pricing-page.component.scss'],
  standalone: true,
  imports: [NgFor, NgIf, RouterLink, TranslatePipe],
})
export class PricingPageComponent implements OnInit {
  readonly profiles: { id: PricingProfile; key: string; icon: string }[] = [
    { id: 'proprietaire', key: 'OWNER', icon: 'fas fa-house-user' },
    { id: 'agent', key: 'AGENT', icon: 'fas fa-id-badge' },
    { id: 'chercheur', key: 'SEEKER', icon: 'fas fa-magnifying-glass-location' },
  ];
  profile: PricingProfile = 'proprietaire';

  readonly proTiers = PRO_BRACKETS;
  readonly contact = PRICING_CONTACT;
  readonly fcfa = formatFcfa;
  readonly params = {
    units: FREE_MAX_OCCUPIED_UNITS,
    nextUnit: FREE_MAX_OCCUPIED_UNITS + 1,
    gold: formatFcfa(GOLD_THRESHOLD),
    days: MIN_OCCUPATION_DAYS,
    trialDays: TRIAL_DURATION_DAYS,
    minPrice: formatFcfa(PRO_BRACKETS[0].price),
    maxPrice: formatFcfa(PRO_BRACKETS[PRO_BRACKETS.length - 1].price),
  };
  readonly bonuses = [
    { key: 'SETUP_48H', icon: 'fas fa-bolt' },
    { key: 'ONBOARDING_30', icon: 'fas fa-chalkboard-user' },
    { key: 'WHATSAPP_SUMMARY', icon: 'fab fa-whatsapp' },
    { key: 'ANNUAL_STATEMENT', icon: 'fas fa-file-invoice' },
    { key: 'PRIVACY', icon: 'fas fa-user-shield' },
    { key: 'MOMO_AT_COST', icon: 'fas fa-mobile-screen-button' },
  ];
  readonly agentFeatures = ['MAX_PROPERTIES', 'ALL_FEATURES', 'VERIFIED_PROFILE', 'EMAIL_SUPPORT'];
  readonly seekerFeatures = ['FREE_SEARCH', 'TOURS_360', 'VERIFIED_LISTINGS', 'PREMIUM_ACCESS'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private languageUrl: LanguageUrlService,
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const requested = params.get('profil') as PricingProfile;
      this.profile = this.profiles.some((p) => p.id === requested) ? requested : 'proprietaire';
    });
  }

  get lang(): string {
    return this.languageUrl.getCurrentLanguage();
  }

  get goldMailto(): string {
    return `mailto:${this.contact.email}?subject=${encodeURIComponent('Offre Gold Ndewa360')}`;
  }

  select(profile: PricingProfile): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: { profil: profile }, replaceUrl: true });
  }
}

import { Component } from '@angular/core';
import { NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageUrlService } from 'src/app/shared/services/language-url.service';
import { PRICING_CONTACT } from 'src/app/shared/pricing/pricing-grid';

/**
 * Page « À propos » (Aide › À propos), aux couleurs du logo (or, noir, blanc
 * cassé). Les informations sont celles des mentions légales et les contacts
 * ceux utilisés dans toute l'application : aucun chiffre ni historique
 * invérifiable (l'ancienne page annonçait 15 experts, 2 000 biens, 3 pays et
 * une pile technique qui n'était pas la nôtre).
 */
@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
  standalone: true,
  imports: [NgFor, RouterLink, TranslatePipe],
})
export class AboutComponent {
  readonly contacts = {
    supportEmail: 'support@ndewa-360.com',
    contactEmail: PRICING_CONTACT.email,
    whatsapp: PRICING_CONTACT.whatsapp,
    whatsappLink: PRICING_CONTACT.whatsappLink,
    website: 'ndewa-360.com',
  };

  readonly offers = [
    { key: 'OWNERS', icon: 'fas fa-house-user' },
    { key: 'AGENTS', icon: 'fas fa-id-badge' },
    { key: 'SEEKERS', icon: 'fas fa-magnifying-glass-location' },
  ];

  readonly values = [
    { key: 'TRANSPARENCY', icon: 'fas fa-eye' },
    { key: 'SIMPLICITY', icon: 'fas fa-hand-pointer' },
    { key: 'PRIVACY', icon: 'fas fa-user-shield' },
    { key: 'PROXIMITY', icon: 'fas fa-handshake' },
  ];

  constructor(private languageUrl: LanguageUrlService) {}

  get lang(): string {
    return this.languageUrl.getCurrentLanguage();
  }
}

import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgFor } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { LanguageUrlService } from 'src/app/shared/services/language-url.service';
import { SeoService } from 'src/app/shared/services/seo/seo.service';
import { IbmIconComponent } from '../../../@youpez/components/ibm-icon/ibm-icon.component';
import { ButtonModule } from 'carbon-components-angular/button';
import { AppLogoComponent } from '../../../@youpez/components/app-logo/app-logo.component';
import { FlexModule } from '@angular/flex-layout/flex';
import { NgScrollbar } from 'ngx-scrollbar';

interface FaqGroup {
  id: string;
  groupName: string;
  children: { id: string; title: string; content: string }[];
}

/** Questions par groupe (clés SUPPORT.FAQ.<GROUPE>.<QUESTION>.QUESTION/ANSWER). */
const FAQ_STRUCTURE: { group: string; questions: string[] }[] = [
  { group: 'GENERAL', questions: ['WHAT_IS_NDEWA', 'IS_FREE', 'TRAINING_VIDEOS'] },
  {
    group: 'OWNERS',
    questions: [
      'HOW_TO_REGISTER', 'HOW_TO_CREATE_PROPERTY', 'PROPERTY_VS_UNIT', 'HOW_TO_ADD_UNIT', 'ADD_360_TOUR',
      'HOW_TO_ADD_TENANT', 'HOW_TO_RECORD_PAYMENT', 'TENANT_NOTIFICATION', 'MONTHLY_REVENUE_TRACKING', 'DOWNLOAD_DOCUMENTS',
    ],
  },
  { group: 'AGENTS', questions: ['HOW_TO_REGISTER', 'VALIDATION', 'PRICING'] },
  { group: 'TENANTS', questions: ['HOW_TO_SEARCH', 'WHAT_IS_360_TOUR', 'IS_360_TOUR_FREE', 'HOW_TO_CONTACT_OWNER', 'HOW_TO_KNOW_AVAILABILITY'] },
  { group: 'BILLING', questions: ['WHAT_COUNTS', 'SUSPENSION', 'SETUP_48H', 'SECURITY'] },
  { group: 'TECHNICAL_SUPPORT', questions: ['NO_EMAIL_RECEIVED', 'PAYMENT_ACCESS_ISSUE', 'HOW_TO_CONTACT_SUPPORT'] },
];

/**
 * FAQ du support. Questions et réponses en HTML natif (<details>) : le texte
 * de chaque réponse est présent dans la page, y compris rendue côté serveur,
 * donc indexable (l'accordéon n'insérait la réponse qu'à l'ouverture). Le
 * balisage FAQPage permet aux moteurs de recherche et aux assistants IA de
 * reprendre directement les réponses.
 */
@Component({
  selector: 'app-faq',
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.scss'],
  standalone: true,
  imports: [NgScrollbar, FlexModule, AppLogoComponent, ButtonModule, IbmIconComponent, NgFor, TranslatePipe],
})
export class FaqComponent implements OnInit, OnDestroy {
  public faq: FaqGroup[] = [];
  private langSub?: Subscription;

  constructor(
    private translate: TranslateService,
    private languageUrlService: LanguageUrlService,
    private router: Router,
    private seo: SeoService,
  ) {}

  ngOnInit(): void {
    this.buildFaqData();
    this.langSub = this.translate.onLangChange.subscribe(() => this.buildFaqData());
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
    this.seo.removeStructuredData('faq');
  }

  private buildFaqData(): void {
    const t = (key: string) => this.translate.instant(`SUPPORT.FAQ.${key}`);
    this.faq = FAQ_STRUCTURE.map(({ group, questions }) => ({
      id: group.toLowerCase(),
      groupName: t(`GROUPS.${group}`),
      children: questions.map((q) => ({
        id: `${group}-${q}`.toLowerCase().replace(/_/g, '-'),
        title: t(`${group}.${q}.QUESTION`),
        content: t(`${group}.${q}.ANSWER`),
      })),
    }));
    this.seo.addStructuredData({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': this.faq.flatMap((g) => g.children).map((q) => ({
        '@type': 'Question',
        'name': q.title,
        'acceptedAnswer': { '@type': 'Answer', 'text': q.content },
      })),
    }, 'faq');
  }

  goBack(): void {
    this.router.navigate([`/${this.languageUrlService.getCurrentLanguage()}/support/welcome`]);
  }
}

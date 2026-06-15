import {
  Component,
  ViewEncapsulation,
  ElementRef,
  ViewChild,
  OnInit,
  OnDestroy,
  HostListener,
} from '@angular/core';
import { LanguageUrlService } from 'src/app/shared/services/language-url.service';
import { TranslationService } from 'src/app/shared/services/localization/translation.service';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { SeoService } from 'src/app/shared/services/seo/seo.service';

@Component({
  selector: 'home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  @ViewChild('modalVideo') modalVideo!: ElementRef<HTMLVideoElement>;

  isVideoModalOpen    = false;
  isAgentDemoModalOpen = false;
  isDemoSubmitting    = false;
  demoSubmitted       = false;

  activeProfile: 'owner' | 'agent' | 'seeker' | null = null;

  agentDemoForm = { name: '', email: '', phone: '', agency: '', portfolio: '' };

  // ── Données statiques par profil ───────────────────────────────────────────

  readonly ownerPains = [
    { key: 'WHO_PAID',          icon: 'fas fa-question-circle', bg: 'bg-red-100',    color: 'text-red-600'    },
    { key: 'UNTIL_WHEN',        icon: 'fas fa-calendar-times',  bg: 'bg-orange-100', color: 'text-orange-600' },
    { key: 'NO_PROOF',          icon: 'fas fa-file-alt',         bg: 'bg-red-100',    color: 'text-red-600'    },
    { key: 'MENTAL_MANAGEMENT', icon: 'fas fa-brain',            bg: 'bg-gray-100',   color: 'text-gray-600'   },
  ];

  readonly ownerFaqs = [
    { key: 'ACCESS',    icon: 'fas fa-mobile-alt'  },
    { key: 'PAYMENT',   icon: 'fas fa-credit-card' },
    { key: 'SECURITY',  icon: 'fas fa-lock'        },
    { key: 'IMPORT',    icon: 'fas fa-download'    },
  ];

  readonly agentPains = [
    { key: 'NO_TOOLS',    icon: 'fas fa-tools'       },
    { key: 'NO_PROFILE',  icon: 'fas fa-id-card-alt' },
    { key: 'NO_TRACKING', icon: 'fas fa-chart-line'  },
    { key: 'NO_TRUST',    icon: 'fas fa-handshake'   },
  ];

  readonly seekerPains = [
    { key: 'FAKE_ADS',    icon: 'fas fa-ban'          },
    { key: 'NO_VISIT',    icon: 'fas fa-eye-slash'    },
    { key: 'UNREACHABLE', icon: 'fas fa-phone-slash'  },
    { key: 'WASTED_TIME', icon: 'fas fa-clock'        },
  ];

  readonly agentAdvantages = [
    { titleKey: 'ADV_1_TITLE', descKey: 'ADV_1_DESC', icon: 'fas fa-id-card',   bg: 'bg-green-100',  color: 'text-green-600'  },
    { titleKey: 'ADV_2_TITLE', descKey: 'ADV_2_DESC', icon: 'fas fa-building',  bg: 'bg-blue-100',   color: 'text-blue-600'   },
    { titleKey: 'ADV_3_TITLE', descKey: 'ADV_3_DESC', icon: 'fas fa-chart-bar', bg: 'bg-purple-100', color: 'text-purple-600' },
    { titleKey: 'ADV_4_TITLE', descKey: 'ADV_4_DESC', icon: 'fas fa-users',     bg: 'bg-yellow-100', color: 'text-yellow-600' },
  ];

  readonly agentSteps = [1, 2, 3, 4]; // utilisé pour le parcours validation

  readonly agentPricingFeatures = ['MAX_PROPERTIES', 'ALL_FEATURES', 'VERIFIED_PROFILE', 'EMAIL_SUPPORT'];

  readonly agentFaqs = [
    { key: 'AGENT_REGISTER',  icon: 'fas fa-user-plus'   },
    { key: 'AGENT_VALIDATION', icon: 'fas fa-shield-alt' },
    { key: 'AGENT_PAYMENT',    icon: 'fas fa-credit-card'},
    { key: 'SUPPORT',          icon: 'fas fa-headset'    },
  ];

  readonly seekerFeatures = [
    { titleKey: 'FEAT_1_TITLE', descKey: 'FEAT_1_DESC', icon: 'fas fa-search',       premium: false },
    { titleKey: 'FEAT_2_TITLE', descKey: 'FEAT_2_DESC', icon: 'fas fa-street-view',  premium: false },
    { titleKey: 'FEAT_3_TITLE', descKey: 'FEAT_3_DESC', icon: 'fas fa-filter',       premium: false },
    { titleKey: 'FEAT_4_TITLE', descKey: 'FEAT_4_DESC', icon: 'fas fa-phone-alt',    premium: true  },
  ];

  readonly seekerPricingFeatures = ['FREE_SEARCH', 'TOURS_360', 'VERIFIED_LISTINGS', 'PREMIUM_ACCESS'];

  readonly seekerFaqs = [
    { key: 'SEEKER_SEARCH',   icon: 'fas fa-search'      },
    { key: 'SEEKER_360',      icon: 'fas fa-street-view' },
    { key: 'SEEKER_PAYMENT',  icon: 'fas fa-credit-card' },
    { key: 'COUNTRIES',       icon: 'fas fa-globe'       },
  ];

  // Données illustration Hero
  readonly heroBarHeights = [40, 55, 45, 70, 60, 80, 95];
  readonly heroMonths = ['Juin','Juil','Août','Sep','Oct','Nov','Déc'];
  readonly heroPayments = [
    { initials: 'JD', name: 'Jean Dupont',    unit: 'Studio A2', amount: '85 000 FCFA', paid: true,  color: 'gold'  },
    { initials: 'MT', name: 'Marie Tchouamo', unit: 'Appt B1',   amount: '120 000 FCFA', paid: true,  color: 'green' },
    { initials: 'SN', name: 'Sévérin N.',    unit: 'Chambre 3', amount: '45 000 FCFA', paid: false, color: 'red'   },
  ];

  // Points clés de la démo propriétaire
  readonly ownerDemoPoints = [
    { key: 'DASHBOARD', icon: 'fas fa-chart-line'     },
    { key: 'PAYMENT',   icon: 'fas fa-credit-card'    },
    { key: 'CONTRACT',  icon: 'fas fa-file-contract'  },
    { key: 'ALERT',     icon: 'fas fa-bell'           },
  ];

  // Avantages démo agent (section inline)
  readonly agentDemoBenefits = [
    { key: 'DURATION',    icon: 'fas fa-clock'       },
    { key: 'PERSONAL',    icon: 'fas fa-user-tie'    },
    { key: 'QUESTIONS',   icon: 'fas fa-comments'    },
    { key: 'SETUP',       icon: 'fas fa-rocket'      },
  ];

  // ──────────────────────────────────────────────────────────────────────────

  private observer!: IntersectionObserver;

  constructor(
    private translationService: TranslationService,
    private languageUrlService: LanguageUrlService,
    private http: HttpClient,
    private seoService: SeoService,
  ) {}

  ngOnInit() {
    const lang = this.languageUrlService.getCurrentLanguage() as 'fr' | 'en';
    this.seoService.setLandingPageSeo(lang);
    this.initScrollAnimations();
  }

  ngOnDestroy() {
    if (this.observer) this.observer.disconnect();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      if (this.isVideoModalOpen) this.closeVideoModal();
      if (this.isAgentDemoModalOpen) this.closeAgentDemoModal();
    }
  }

  // ── Sélection du profil ───────────────────────────────────────────────────

  selectProfile(profile: 'owner' | 'agent' | 'seeker'): void {
    // Toggle : re-cliquer sur le profil actif le ferme
    this.activeProfile = this.activeProfile === profile ? null : profile;
    if (this.activeProfile) {
      // Scroll vers le contenu après rendu
      setTimeout(() => {
        document.getElementById('profile-content')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
      // Réinitialiser les animations scroll sur le nouveau contenu
      setTimeout(() => this.observeNewElements(), 200);
    }
  }

  // ── Vidéo ─────────────────────────────────────────────────────────────────

  openVideoModal() {
    this.isVideoModalOpen = true;
    if (this.modalVideo) {
      this.modalVideo.nativeElement.currentTime = 0;
      this.modalVideo.nativeElement.play();
    }
    document.body.style.overflow = 'hidden';
  }

  closeVideoModal() {
    this.isVideoModalOpen = false;
    if (this.modalVideo) this.modalVideo.nativeElement.pause();
    document.body.style.overflow = 'auto';
  }

  // ── Modale démo agent ─────────────────────────────────────────────────────

  openAgentDemoModal() {
    this.isAgentDemoModalOpen = true;
    this.demoSubmitted = false;
    document.body.style.overflow = 'hidden';
  }

  closeAgentDemoModal() {
    this.isAgentDemoModalOpen = false;
    document.body.style.overflow = 'auto';
  }

  submitAgentDemoRequest() {
    if (!this.agentDemoForm.name || !this.agentDemoForm.email || !this.agentDemoForm.phone) return;
    this.isDemoSubmitting = true;
    this.http.post(`${environment.apiUrl}/prospection/new-contact`, {
      name: this.agentDemoForm.name,
      email: this.agentDemoForm.email,
      tel: this.agentDemoForm.phone,
      object: `Demande de démo agent${this.agentDemoForm.agency ? ' — ' + this.agentDemoForm.agency : ''}`,
      message: `Portefeuille : ${this.agentDemoForm.portfolio || 'non renseigné'}\nAgence : ${this.agentDemoForm.agency || 'non renseignée'}\nTéléphone : ${this.agentDemoForm.phone}`,
    }).subscribe({
      next: () => this.onDemoSuccess(),
      error: () => this.onDemoSuccess(),
    });
  }

  private onDemoSuccess() {
    this.isDemoSubmitting = false;
    this.demoSubmitted = true;
    this.agentDemoForm = { name: '', email: '', phone: '', agency: '', portfolio: '' };
  }

  // ── Animations scroll ─────────────────────────────────────────────────────

  private initScrollAnimations() {
    const opts = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('animate'); });
    }, opts);
    setTimeout(() => this.observeNewElements(), 100);
    this.initParallaxShapes();
  }

  private parallaxRaf = 0;
  private initParallaxShapes() {
    const onScroll = () => {
      if (this.parallaxRaf) return;
      this.parallaxRaf = requestAnimationFrame(() => {
        this.parallaxRaf = 0;
        const y = window.scrollY;
        document.querySelectorAll<HTMLElement>('.deco-bg, .deco-hex, .deco-grid').forEach((el) => {
          const rect = el.getBoundingClientRect();
          const center = rect.top + rect.height / 2;
          const offset = (window.innerHeight / 2 - center) * 0.06;
          el.style.setProperty('--deco-offset', `${offset}px`);
        });
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  private observeNewElements() {
    document.querySelectorAll(
      '.scroll-animate:not(.animate), .scroll-animate-left:not(.animate), .scroll-animate-right:not(.animate), .scroll-animate-scale:not(.animate)'
    ).forEach((el) => this.observer.observe(el));
  }

  // ── Utils ─────────────────────────────────────────────────────────────────

  t(key: string, params?: any): string {
    return this.translationService.instant(key, params);
  }

  getCurrentLanguage(): string {
    return this.languageUrlService.getCurrentLanguage();
  }
}

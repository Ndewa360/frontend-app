import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { FundraisingService, CampaignStats } from '../services/fundraising.service';
import { ImageModalComponent } from '../image-modal/image-modal.component';

interface DonationTier {
  amount: number;
  title: string;
  description: string;
  benefits: string[];
  popular?: boolean;
}

interface FundingGoal {
  category: string;
  amount: number;
  percentage: number;
  description: string;
  icon: string;
}

interface TeamMember {
  name: string;
  role: string;
  description: string;
  image: string;
  linkedin?: string;
  twitter?: string;
}

@Component({
  selector: 'app-fundraising-page',
  templateUrl: './fundraising-page.component.html',
  styleUrls: ['./fundraising-page.component.scss']
})
export class FundraisingPageComponent implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();
  private observer!: IntersectionObserver;
  donationForm: FormGroup;
  newsletterForm: FormGroup;
  isSubmittingNewsletter = false;
  
  // Galerie d'images
  public galleryImages: any[] = [];
  
  // Objectifs de financement
  totalGoal = 5000000; // 5 millions FCFA
  currentAmount = 0;
  progressPercentage = 0;
  campaignStats: CampaignStats | null = null;
  isSubmittingDonation = false;
  
  // Paliers de dons
  donationTiers: DonationTier[] = [];

  // Équipe du projet
  teamMembers: TeamMember[] = [];

  // Répartition des fonds
  fundingGoals: FundingGoal[] = [];

  constructor(
    private fb: FormBuilder,
    private fundraisingService: FundraisingService,
    private elementRef: ElementRef,
    private dialog: MatDialog,
    private translate: TranslateService
  ) {
    this.donationForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(1000)]],
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      message: ['']
    });
    
    this.newsletterForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      name: ['', Validators.required],
      interests: [[]]
    });
  }

  ngOnInit(): void {
    this.initializeData();
    this.calculateProgress();
    this.loadCampaignStats();
    this.setupAnimations();
    
    // Écouter les changements de langue
    this.translate.onLangChange
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.initializeData();
      });
  }

  private initializeData(): void {
    this.donationTiers = [
      {
        amount: 10000,
        title: this.translate.instant('FUNDRAISING.DONATION.TIERS.SUPPORTER'),
        description: this.translate.instant('FUNDRAISING.DONATION.TIERS.SUPPORTER_DESC'),
        benefits: [
          this.translate.instant('FUNDRAISING.DONATION.BENEFITS.SOCIAL_THANKS'),
          this.translate.instant('FUNDRAISING.DONATION.BENEFITS.MONTHLY_NEWSLETTER')
        ]
      },
      {
        amount: 50000,
        title: this.translate.instant('FUNDRAISING.DONATION.TIERS.CONTRIBUTOR'),
        description: this.translate.instant('FUNDRAISING.DONATION.TIERS.CONTRIBUTOR_DESC'),
        benefits: [
          this.translate.instant('FUNDRAISING.DONATION.BENEFITS.EARLY_ACCESS'),
          this.translate.instant('FUNDRAISING.DONATION.BENEFITS.CONTRIBUTOR_BADGE'),
          this.translate.instant('FUNDRAISING.DONATION.BENEFITS.MONTHLY_NEWSLETTER')
        ]
      },
      {
        amount: 100000,
        title: this.translate.instant('FUNDRAISING.DONATION.TIERS.PARTNER'),
        description: this.translate.instant('FUNDRAISING.DONATION.TIERS.PARTNER_DESC'),
        benefits: [
          this.translate.instant('FUNDRAISING.DONATION.BENEFITS.PARTNER_MENTION'),
          this.translate.instant('FUNDRAISING.DONATION.BENEFITS.VIP_ACCESS'),
          this.translate.instant('FUNDRAISING.DONATION.BENEFITS.PRODUCT_CONSULTATION'),
          this.translate.instant('FUNDRAISING.DONATION.BENEFITS.MONTHLY_NEWSLETTER')
        ],
        popular: true
      },
      {
        amount: 500000,
        title: this.translate.instant('FUNDRAISING.DONATION.TIERS.SPONSOR'),
        description: this.translate.instant('FUNDRAISING.DONATION.TIERS.SPONSOR_DESC'),
        benefits: [
          this.translate.instant('FUNDRAISING.DONATION.BENEFITS.PLATFORM_LOGO'),
          this.translate.instant('FUNDRAISING.DONATION.BENEFITS.PRIVILEGED_PARTNERSHIP'),
          this.translate.instant('FUNDRAISING.DONATION.BENEFITS.PRIORITY_API'),
          this.translate.instant('FUNDRAISING.DONATION.BENEFITS.STRATEGIC_CONSULTATION')
        ]
      }
    ];

    this.teamMembers = [
      {
        name: 'Jean-Claude KAMDEM',
        role: this.translate.instant('FUNDRAISING.TEAM.ROLES.CEO_FOUNDER'),
        description: this.translate.instant('FUNDRAISING.TEAM.DESCRIPTIONS.CEO_DESC'),
        image: 'assets/team/ceo.jpg',
        linkedin: '#',
        twitter: '#'
      },
      {
        name: 'Marie NGUEFACK',
        role: this.translate.instant('FUNDRAISING.TEAM.ROLES.CTO'),
        description: this.translate.instant('FUNDRAISING.TEAM.DESCRIPTIONS.CTO_DESC'),
        image: 'assets/team/cto.jpg',
        linkedin: '#'
      },
      {
        name: 'Paul FOTSO',
        role: this.translate.instant('FUNDRAISING.TEAM.ROLES.MARKETING_DIRECTOR'),
        description: this.translate.instant('FUNDRAISING.TEAM.DESCRIPTIONS.MARKETING_DESC'),
        image: 'assets/team/marketing.jpg',
        linkedin: '#',
        twitter: '#'
      },
      {
        name: 'Sylvie MBALLA',
        role: this.translate.instant('FUNDRAISING.TEAM.ROLES.PRODUCT_MANAGER'),
        description: this.translate.instant('FUNDRAISING.TEAM.DESCRIPTIONS.PRODUCT_DESC'),
        image: 'assets/team/product.jpg',
        linkedin: '#'
      }
    ];

    this.fundingGoals = [
      {
        category: this.translate.instant('FUNDRAISING.FUNDING.CATEGORIES.MARKETING'),
        amount: 2000000,
        percentage: 40,
        description: this.translate.instant('FUNDRAISING.FUNDING.CATEGORIES.MARKETING_DESC'),
        icon: 'campaign'
      },
      {
        category: this.translate.instant('FUNDRAISING.FUNDING.CATEGORIES.DEVELOPMENT'),
        amount: 1500000,
        percentage: 30,
        description: this.translate.instant('FUNDRAISING.FUNDING.CATEGORIES.DEVELOPMENT_DESC'),
        icon: 'code'
      },
      {
        category: this.translate.instant('FUNDRAISING.FUNDING.CATEGORIES.HUMAN_RESOURCES'),
        amount: 1000000,
        percentage: 20,
        description: this.translate.instant('FUNDRAISING.FUNDING.CATEGORIES.HUMAN_RESOURCES_DESC'),
        icon: 'group'
      },
      {
        category: this.translate.instant('FUNDRAISING.FUNDING.CATEGORIES.INFRASTRUCTURE'),
        amount: 500000,
        percentage: 10,
        description: this.translate.instant('FUNDRAISING.FUNDING.CATEGORIES.INFRASTRUCTURE_DESC'),
        icon: 'cloud'
      }
    ];

    this.galleryImages = [
      { 
        src: 'assets/cap_apps/page de recherche.png', 
        title: this.translate.instant('FUNDRAISING.PRODUCT.FEATURES.SMART_SEARCH'), 
        description: this.translate.instant('FUNDRAISING.PRODUCT.FEATURES.SMART_SEARCH_DESC') 
      },
      { 
        src: 'assets/cap_apps/dasbord global.jpg', 
        title: this.translate.instant('FUNDRAISING.PRODUCT.FEATURES.DASHBOARD'), 
        description: this.translate.instant('FUNDRAISING.PRODUCT.FEATURES.DASHBOARD_DESC') 
      },
      { 
        src: 'assets/cap_apps/analyse financiere.png', 
        title: this.translate.instant('FUNDRAISING.PRODUCT.FEATURES.FINANCIAL_MANAGEMENT'), 
        description: this.translate.instant('FUNDRAISING.PRODUCT.FEATURES.FINANCIAL_MANAGEMENT_DESC') 
      },
      { 
        src: 'assets/cap_apps/gestion de contrat.png', 
        title: this.translate.instant('FUNDRAISING.PRODUCT.FEATURES.DIGITAL_CONTRACTS'), 
        description: this.translate.instant('FUNDRAISING.PRODUCT.FEATURES.DIGITAL_CONTRACTS_DESC') 
      },
      { 
        src: 'assets/cap_apps/facturation.png', 
        title: this.translate.instant('FUNDRAISING.PRODUCT.FEATURES.AUTOMATED_BILLING'), 
        description: this.translate.instant('FUNDRAISING.PRODUCT.FEATURES.AUTOMATED_BILLING_DESC') 
      },
      { 
        src: 'assets/cap_apps/capture-information-contact-proprio.png', 
        title: this.translate.instant('FUNDRAISING.PRODUCT.FEATURES.DIRECT_CONTACT'), 
        description: this.translate.instant('FUNDRAISING.PRODUCT.FEATURES.DIRECT_CONTACT_DESC') 
      }
    ];
  }

  ngAfterViewInit(): void {
    this.initIntersectionObserver();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private loadCampaignStats(): void {
    this.fundraisingService.campaignStats$
      .pipe(takeUntil(this.destroy$))
      .subscribe(stats => {
        this.campaignStats = stats;
        this.currentAmount = stats.totalRaised;
        this.progressPercentage = stats.percentageReached;
      });
  }

  private calculateProgress(): void {
    this.progressPercentage = Math.min((this.currentAmount / this.totalGoal) * 100, 100);
  }

  selectDonationTier(tier: DonationTier): void {
    this.donationForm.patchValue({ amount: tier.amount });
  }

  onSubmitDonation(): void {
    if (this.donationForm.valid && !this.isSubmittingDonation) {
      this.isSubmittingDonation = true;
      const formData = this.donationForm.value;
      
      // Animation du bouton
      const button = this.elementRef.nativeElement.querySelector('button[type="submit"]');
      if (button) {
        button.classList.add('animate-pulse');
      }
      
      this.fundraisingService.submitDonation(formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            console.log('Donation successful:', response);
            this.fundraisingService.updateStatsAfterDonation(formData.amount);
            this.donationForm.reset();
            
            // Animation de succès
            if (button) {
              button.classList.remove('animate-pulse');
              button.classList.add('animate-bounce');
            }
            
            alert(this.translate.instant('FUNDRAISING.ALERTS.DONATION_SUCCESS'));
          },
          error: (error) => {
            console.error('Donation failed:', error);
            
            // Animation d'erreur
            if (button) {
              button.classList.remove('animate-pulse');
              button.classList.add('animate-wiggle');
            }
            
            alert(this.translate.instant('FUNDRAISING.ALERTS.DONATION_ERROR'));
          },
          complete: () => {
            this.isSubmittingDonation = false;
            
            // Nettoyer les animations
            setTimeout(() => {
              if (button) {
                button.classList.remove('animate-bounce', 'animate-wiggle');
              }
            }, 1000);
          }
        });
    }
  }

  onSubmitNewsletter(): void {
    if (this.newsletterForm.valid && !this.isSubmittingNewsletter) {
      this.isSubmittingNewsletter = true;
      const formData = this.newsletterForm.value;
      
      // Simulation d'envoi
      setTimeout(() => {
        console.log('Newsletter subscription:', formData);
        this.newsletterForm.reset();
        this.isSubmittingNewsletter = false;
        alert(this.translate.instant('FUNDRAISING.ALERTS.NEWSLETTER_SUCCESS'));
      }, 1000);
    }
  }

  openImageModal(imageSrc: string, title: string): void {
    const currentIndex = this.galleryImages.findIndex(img => img.src === imageSrc);
    console.log('Opening gallery:', { imageSrc, title, currentIndex, images: this.galleryImages });
    const dialogRef = this.dialog.open(ImageModalComponent, {
      data: { 
        images: this.galleryImages, 
        currentIndex: currentIndex >= 0 ? currentIndex : 0 
      },
      width: '98vw',
      height: '98vh',
      maxWidth: 'none',
      maxHeight: 'none',
      panelClass: 'image-gallery-dialog'
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(amount);
  }

  private setupAnimations(): void {
    // Ajouter des classes d'animation aux éléments
    setTimeout(() => {
      const elements = this.elementRef.nativeElement.querySelectorAll('.animate-on-load');
      elements.forEach((el: HTMLElement, index: number) => {
        setTimeout(() => {
          el.classList.add('animate-fade-in-up');
        }, index * 100);
      });
    }, 100);
  }

  private initIntersectionObserver(): void {
    const options = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;
          
          if (element.classList.contains('fade-in-on-scroll')) {
            element.classList.add('visible');
          }
          if (element.classList.contains('slide-in-left')) {
            element.classList.add('visible');
          }
          if (element.classList.contains('slide-in-right')) {
            element.classList.add('visible');
          }
          if (element.classList.contains('animate-wiggle-on-scroll')) {
            element.classList.add('animate-wiggle');
          }
        }
      });
    }, options);

    // Observer tous les éléments avec des classes d'animation
    const animatedElements = this.elementRef.nativeElement.querySelectorAll(
      '.fade-in-on-scroll, .slide-in-left, .slide-in-right, .animate-wiggle-on-scroll'
    );
    
    animatedElements.forEach((el: Element) => {
      this.observer.observe(el);
    });
  }
}
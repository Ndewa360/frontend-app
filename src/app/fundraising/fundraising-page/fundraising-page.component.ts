import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
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
  public galleryImages = [
    { src: 'assets/cap_apps/page de recherche.png', title: 'Recherche Intelligente', description: 'Moteur de recherche intelligent avec filtres avancés (ville, type, prix, disponibilité) et géolocalisation précise.' },
    { src: 'assets/cap_apps/dasbord global.jpg', title: 'Tableau de Bord', description: 'Tableau de bord complet avec revenus mensuels, taux d\'occupation et état de chaque locataire en temps réel.' },
    { src: 'assets/cap_apps/analyse financiere.png', title: 'Gestion Financière', description: 'Suivi automatique des paiements, calcul des mois couverts, relances automatiques et statistiques dynamiques.' },
    { src: 'assets/cap_apps/gestion de contrat.png', title: 'Contrats Digitaux', description: 'Génération automatique de contrats de location avec signature électronique et gestion centralisée.' },
    { src: 'assets/cap_apps/facturation.png', title: 'Facturation Automatisée', description: 'Facturation automatique, envoi par mail/WhatsApp et synchronisation avec les paiements mobiles.' },
    { src: 'assets/cap_apps/capture-information-contact-proprio.png', title: 'Contact Direct', description: 'Communication sécurisée entre locataires et propriétaires avec système de vérification intégré.' }
  ];
  
  // Objectifs de financement
  totalGoal = 5000000; // 5 millions FCFA
  currentAmount = 0;
  progressPercentage = 0;
  campaignStats: CampaignStats | null = null;
  isSubmittingDonation = false;
  
  // Paliers de dons
  donationTiers: DonationTier[] = [
    {
      amount: 10000,
      title: 'Supporter',
      description: 'Soutenez notre mission',
      benefits: ['Remerciement sur les réseaux sociaux', 'Newsletter mensuelle']
    },
    {
      amount: 50000,
      title: 'Contributeur',
      description: 'Contribuez au développement',
      benefits: ['Accès anticipé aux nouvelles fonctionnalités', 'Badge contributeur', 'Newsletter mensuelle']
    },
    {
      amount: 100000,
      title: 'Partenaire',
      description: 'Devenez partenaire du projet',
      benefits: ['Mention comme partenaire', 'Accès VIP', 'Consultation produit', 'Newsletter mensuelle'],
      popular: true
    },
    {
      amount: 500000,
      title: 'Sponsor',
      description: 'Sponsorisez l\'innovation',
      benefits: ['Logo sur la plateforme', 'Partenariat privilégié', 'Accès API prioritaire', 'Consultation stratégique']
    }
  ];

  // Équipe du projet
  teamMembers: TeamMember[] = [
    {
      name: 'Jean-Claude KAMDEM',
      role: 'CEO & Fondateur',
      description: 'Expert en immobilier avec 10+ ans d\'expérience dans l\'innovation technologique',
      image: 'assets/team/ceo.jpg',
      linkedin: '#',
      twitter: '#'
    },
    {
      name: 'Marie NGUEFACK',
      role: 'CTO',
      description: 'Développeuse senior spécialisée en architecture cloud et technologies 360°',
      image: 'assets/team/cto.jpg',
      linkedin: '#'
    },
    {
      name: 'Paul FOTSO',
      role: 'Directeur Marketing',
      description: 'Stratège marketing digital avec expertise en croissance startup',
      image: 'assets/team/marketing.jpg',
      linkedin: '#',
      twitter: '#'
    },
    {
      name: 'Sylvie MBALLA',
      role: 'Responsable Produit',
      description: 'Product Manager experte en UX/UI et gestion de produits immobiliers',
      image: 'assets/team/product.jpg',
      linkedin: '#'
    }
  ];

  // Répartition des fonds
  fundingGoals: FundingGoal[] = [
    {
      category: 'Marketing & Communication',
      amount: 2000000,
      percentage: 40,
      description: 'Campagnes publicitaires, création de contenu, événements de lancement',
      icon: 'campaign'
    },
    {
      category: 'Développement Technique',
      amount: 1500000,
      percentage: 30,
      description: 'Amélioration de la plateforme, nouvelles fonctionnalités, optimisation',
      icon: 'code'
    },
    {
      category: 'Ressources Humaines',
      amount: 1000000,
      percentage: 20,
      description: 'Recrutement d\'experts, formation de l\'équipe, consultants',
      icon: 'group'
    },
    {
      category: 'Infrastructure & Opérations',
      amount: 500000,
      percentage: 10,
      description: 'Serveurs, licences, outils de développement, frais opérationnels',
      icon: 'cloud'
    }
  ];

  constructor(
    private fb: FormBuilder,
    private fundraisingService: FundraisingService,
    private elementRef: ElementRef,
    private dialog: MatDialog
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
    this.calculateProgress();
    this.loadCampaignStats();
    this.setupAnimations();
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
            
            alert('Merci pour votre don ! Votre contribution fait la différence.');
          },
          error: (error) => {
            console.error('Donation failed:', error);
            
            // Animation d'erreur
            if (button) {
              button.classList.remove('animate-pulse');
              button.classList.add('animate-wiggle');
            }
            
            alert('Une erreur est survenue. Veuillez réessayer.');
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
        alert('Merci ! Vous êtes maintenant inscrit à notre newsletter.');
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
import { Component, OnInit, OnDestroy, HostListener, ElementRef, ViewChild } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { UserProfileModel, UserProfileState, UserProfileAction } from 'src/app/shared/store';

interface ProfileSection {
  id: string;
  label: string;
  labelKey: string;
  icon: string;
}

@Component({
  selector: 'user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit, OnDestroy {
  @ViewChild('profileContent', { static: false }) profileContent: ElementRef;

  @Select(UserProfileState.selectStateUserProfile) userProfile$: Observable<UserProfileModel>;
  @Select(UserProfileState.selectStateLoading) profileStateLoading$: Observable<boolean>;

  title = 'Mon Profil';
  activeSection = 'personal';

  // Propriétés pour la détection de scroll
  private isScrolling = false;
  private scrollTimeout: any;
  private sectionOffsets: Map<string, number> = new Map();
  private intersectionObserver: IntersectionObserver;

  profileSections: ProfileSection[] = [
    { id: 'personal', label: 'Informations personnelles', labelKey: 'PROFILE.SECTIONS.PERSONAL', icon: 'user' },
    { id: 'contact', label: 'Contacts & Réseaux', labelKey: 'PROFILE.SECTIONS.CONTACT', icon: 'phone' },
    { id: 'location', label: 'Localisation', labelKey: 'PROFILE.SECTIONS.LOCATION', icon: 'location' },
    { id: 'localization', label: 'Langue & Devise', labelKey: 'PROFILE.SECTIONS.LOCALIZATION', icon: 'globe' },
    { id: 'display', label: 'Affichage', labelKey: 'PROFILE.SECTIONS.DISPLAY', icon: 'view' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private _store: Store
  ){}

  ngOnInit(): void {
    // Charger le profil utilisateur au démarrage
    this._store.dispatch(new UserProfileAction.FetchUserProfile());

    // Initialiser la détection de scroll après le rendu
    setTimeout(() => {
      this.calculateSectionOffsets();
      this.setupIntersectionObserver();
      this.detectCurrentSection();
    }, 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // Nettoyer l'intersection observer
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }

    // Nettoyer le timeout
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
  }



  scrollToSection(sectionId: string): void {
    // Marquer qu'on est en train de scroller programmatiquement
    this.isScrolling = true;
    this.activeSection = sectionId;

    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      });

      // Réinitialiser le flag après l'animation de scroll
      setTimeout(() => {
        this.isScrolling = false;
      }, 1000);
    }
  }

  onSectionChange(sectionId: string): void {
    this.activeSection = sectionId;
  }

  trackBySection(_: number, section: ProfileSection): string {
    return section.id;
  }

  // Méthodes pour la détection automatique de scroll
  @HostListener('window:scroll', ['$event'])
  onWindowScroll(): void {
    // Ne pas détecter si on est en train de scroller programmatiquement
    if (this.isScrolling) return;

    // Debounce pour éviter trop d'appels
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }

    this.scrollTimeout = setTimeout(() => {
      this.detectCurrentSection();
    }, 50);
  }

  private calculateSectionOffsets(): void {
    this.sectionOffsets.clear();

    this.profileSections.forEach(section => {
      const element = document.getElementById(`section-${section.id}`);
      if (element) {
        const rect = element.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        this.sectionOffsets.set(section.id, rect.top + scrollTop);
      }
    });
  }

  private detectCurrentSection(): void {
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const offset = windowHeight * 0.3; // 30% de la hauteur de l'écran comme offset

    let currentSection = this.profileSections[0].id; // Section par défaut

    // Trouver la section actuellement visible
    for (const section of this.profileSections) {
      const element = document.getElementById(`section-${section.id}`);
      if (element) {
        const rect = element.getBoundingClientRect();
        const elementTop = rect.top + scrollPosition;
        const elementBottom = elementTop + rect.height;

        // Vérifier si la section est visible dans la zone de détection
        if (scrollPosition + offset >= elementTop && scrollPosition + offset < elementBottom) {
          currentSection = section.id;
          break;
        }
      }
    }

    // Mettre à jour la section active si elle a changé
    if (currentSection !== this.activeSection) {
      this.activeSection = currentSection;
    }
  }

  // Méthode pour recalculer les offsets quand le contenu change
  onContentChange(): void {
    setTimeout(() => {
      this.calculateSectionOffsets();
    }, 100);
  }

  // Configuration de l'Intersection Observer pour une détection plus précise
  private setupIntersectionObserver(): void {
    const options = {
      root: null, // Utilise la viewport
      rootMargin: '-20% 0px -60% 0px', // Zone de détection optimisée
      threshold: [0, 0.1, 0.5, 1.0] // Différents seuils de visibilité
    };

    this.intersectionObserver = new IntersectionObserver((entries) => {
      if (this.isScrolling) return; // Ne pas interférer avec le scroll programmatique

      let mostVisibleSection = '';
      let maxVisibilityRatio = 0;

      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio > maxVisibilityRatio) {
          maxVisibilityRatio = entry.intersectionRatio;
          const sectionId = entry.target.id.replace('section-', '');
          mostVisibleSection = sectionId;
        }
      });

      // Mettre à jour la section active si on a trouvé une section plus visible
      if (mostVisibleSection && mostVisibleSection !== this.activeSection) {
        this.activeSection = mostVisibleSection;
      }
    }, options);

    // Observer toutes les sections
    this.profileSections.forEach(section => {
      const element = document.getElementById(`section-${section.id}`);
      if (element) {
        this.intersectionObserver.observe(element);
      }
    });
  }

  @HostListener('window:scroll', ['$event'])
  onScroll(): void {
    // Détecter la section visible pour mettre à jour la navigation
    const sections = this.profileSections.map(s => s.id);
    let currentSection = this.activeSection;

    for (const sectionId of sections) {
      const element = document.getElementById(`section-${sectionId}`);
      if (element) {
        const rect = element.getBoundingClientRect();
        if (rect.top <= 200 && rect.bottom >= 200) {
          currentSection = sectionId;
          break;
        }
      }
    }

    if (currentSection !== this.activeSection) {
      this.activeSection = currentSection;
    }
  }
}

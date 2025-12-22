import { Component, ViewEncapsulation, ElementRef, ViewChild, OnInit, OnDestroy, HostListener } from '@angular/core';
import { LanguageUrlService } from 'src/app/shared/services/language-url.service';
import { TranslationService } from 'src/app/shared/services/localization/translation.service';

@Component({
  selector: 'home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  // encapsulation: ViewEncapsulation.None
})
export class HomeComponent implements OnInit, OnDestroy {
  @ViewChild('modalVideo') modalVideo!: ElementRef<HTMLVideoElement>;
  
  isVideoModalOpen = false;
  private observer!: IntersectionObserver;
  private listObserver!: IntersectionObserver;

  constructor(
    private translationService: TranslationService,
    private languageUrlService: LanguageUrlService
) {}

  ngOnInit() {
    this.initScrollAnimations();
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.listObserver) {
      this.listObserver.disconnect();
    }
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.isVideoModalOpen) {
      this.closeVideoModal();
    }
  }

  openVideoModal() {
    this.isVideoModalOpen = true;
    if (this.modalVideo) {
      this.modalVideo.nativeElement.currentTime = 0;
      this.modalVideo.nativeElement.play();
    }
    // Empêcher le scroll de la page
    document.body.style.overflow = 'hidden';
  }

  closeVideoModal() {
    this.isVideoModalOpen = false;
    if (this.modalVideo) {
      this.modalVideo.nativeElement.pause();
    }
    // Réactiver le scroll de la page
    document.body.style.overflow = 'auto';
  }

  private initScrollAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate');
        }
      });
    }, observerOptions);

    // Animation séquentielle pour les listes
    this.listObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const listItems = entry.target.querySelectorAll('li.scroll-animate');
          listItems.forEach((item, index) => {
            setTimeout(() => {
              item.classList.add('animate');
            }, index * 100);
          });
        }
      });
    }, observerOptions);

    // Observer tous les éléments avec les classes d'animation
    setTimeout(() => {
      const animateElements = document.querySelectorAll('.scroll-animate, .scroll-animate-left, .scroll-animate-right, .scroll-animate-scale');
      animateElements.forEach((el) => {
        this.observer.observe(el);
      });
      
      // Observer les listes pour animation séquentielle
      const lists = document.querySelectorAll('ul');
      lists.forEach((list) => {
        if (list.querySelector('li.scroll-animate')) {
          this.listObserver.observe(list);
        }
      });
    }, 100);
  }

  /**
   * Obtient la traduction d'une clé
   */
  t(key: string, params?: any): string {
    return this.translationService.instant(key, params);
  }

  getCurrentLanguage(): string {
    return this.languageUrlService.getCurrentLanguage();
  }
}

import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgClass, NgFor, NgIf, NgSwitch, NgSwitchCase } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { NgScrollbar } from 'ngx-scrollbar';
import { LanguageUrlService } from 'src/app/shared/services/language-url.service';
import { MANUAL, ManualArticle, ManualLang, ManualSection, ManualUi } from './manual-content';

/**
 * Documentation (Support › Documentation).
 *
 * Remplace un gabarit de démonstration (texte anglais sur les « pull
 * requests », menu en doublon, aucun contenu affiché) par la documentation
 * Ndewa360 en français et en anglais : chaque entrée du sommaire ouvre son
 * article, partageable par son adresse (?article=…).
 */
@Component({
  selector: 'app-manual',
  templateUrl: './manual.component.html',
  styleUrls: ['./manual.component.scss'],
  standalone: true,
  imports: [NgScrollbar, NgFor, NgIf, NgClass, NgSwitch, NgSwitchCase, RouterLink],
})
export class ManualComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly languageUrl = inject(LanguageUrlService);
  private readonly destroyRef = inject(DestroyRef);

  lang: ManualLang = 'fr';
  ui: ManualUi = MANUAL.fr.ui;
  sections: ManualSection[] = MANUAL.fr.sections;
  article!: ManualArticle;
  menuOpen = false;

  ngOnInit(): void {
    this.applyLanguage(this.languageUrl.getCurrentLanguage());
    this.translate.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ lang }) => this.applyLanguage(lang));
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => this.show(params.get('article')));
  }

  get articles(): ManualArticle[] {
    return this.sections.flatMap((section) => section.articles);
  }

  get index(): number {
    return this.articles.findIndex((a) => a.id === this.article?.id);
  }

  get previous(): ManualArticle | null {
    return this.articles[this.index - 1] ?? null;
  }

  get next(): ManualArticle | null {
    return this.articles[this.index + 1] ?? null;
  }

  sectionOf(article: ManualArticle): ManualSection | undefined {
    return this.sections.find((s) => s.articles.includes(article));
  }

  /** Lien vers une page de l'application, dans la langue courante. */
  linkTo(path: string[]): string[] {
    return ['/', this.lang, ...path];
  }

  open(article: ManualArticle): void {
    this.menuOpen = false;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { article: article.id },
      replaceUrl: true,
    });
    document.querySelector<HTMLElement>('.manual__content .ng-scroll-viewport')?.scrollTo({ top: 0 });
  }

  private applyLanguage(lang: string): void {
    this.lang = lang === 'en' ? 'en' : 'fr';
    this.ui = MANUAL[this.lang].ui;
    this.sections = MANUAL[this.lang].sections;
    this.show(this.article?.id ?? this.route.snapshot.queryParamMap.get('article'));
  }

  private show(id: string | null): void {
    this.article = this.articles.find((a) => a.id === id) ?? this.articles[0];
  }
}

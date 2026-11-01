import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
  Output,
  EventEmitter,
  HostListener,
  Inject,
  OnDestroy,
  PLATFORM_ID
} from '@angular/core';
import { ButtonModule } from 'carbon-components-angular/button';
import { NgClass, NgFor, NgIf, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { NgScrollbar } from 'ngx-scrollbar';
import { FlexModule } from '@angular/flex-layout/flex';
import { ExtendedModule } from '@angular/flex-layout/extended';
import { IbmIconComponent } from '../ibm-icon/ibm-icon.component';
import { LocataireState, PropertyState, RoomState } from 'src/app/shared/store';
import { currentAppLanguage } from 'src/app/shared/services/localization/app-locale';

/** Un résultat de la recherche globale et la page vers laquelle il mène. */
export interface GlobalSearchResult {
  kind: 'page' | 'property' | 'unit' | 'tenant';
  label: string;
  detail?: string;
  /** Segments de route après /:lang/ */
  route: string[];
  fragment?: string;
}

/** Pages de l'application proposées par la recherche (clé de traduction + route). */
const APP_PAGES: { labelKey: string; route: string[]; keywords: string }[] = [
  { labelKey: 'GLOBAL_SEARCH.PAGES.PROPERTIES', route: ['app', 'properties', 'home'], keywords: 'biens propriétés properties maison immeuble' },
  { labelKey: 'GLOBAL_SEARCH.PAGES.BILLING', route: ['app', 'facturation', 'plan', 'dashboard'], keywords: 'facturation abonnement facture billing invoice subscription' },
  { labelKey: 'GLOBAL_SEARCH.PAGES.INVOICES', route: ['app', 'facturation', 'plan', 'plan-list'], keywords: 'factures historique paiements invoices' },
  { labelKey: 'GLOBAL_SEARCH.PAGES.WALLET', route: ['app', 'portefeuille'], keywords: 'portefeuille wallet retrait solde' },
  { labelKey: 'GLOBAL_SEARCH.PAGES.CONTRACT_TEMPLATES', route: ['app', 'contract-templates'], keywords: 'modèles contrat bail templates' },
  { labelKey: 'GLOBAL_SEARCH.PAGES.PROFILE', route: ['app', 'profile'], keywords: 'profil compte paramètres profile settings' },
  { labelKey: 'GLOBAL_SEARCH.PAGES.SUPPORT', route: ['support', 'welcome'], keywords: 'aide support help faq documentation' },
  { labelKey: 'GLOBAL_SEARCH.PAGES.PUBLIC_SEARCH', route: ['search', 'index'], keywords: 'recherche annonces logements search' },
];

const MAX_RESULTS = 20;

/**
 * Recherche globale du tableau de bord : biens, unités, locataires et pages,
 * à partir des données déjà chargées. Un clic (ou Entrée) ouvre la page du
 * résultat. L'ancienne version affichait des résultats fictifs et ses
 * boutons ne faisaient que fermer la fenêtre.
 */
@Component({
  selector: 'youpez-search',
  templateUrl: './app-search.component.html',
  styleUrls: ['./app-search.component.scss'],
  standalone: true,
  imports: [IbmIconComponent, ExtendedModule, FlexModule, NgScrollbar, NgIf, NgFor, NgClass, ButtonModule, TranslatePipe]
})
export class AppSearchComponent implements OnInit, AfterViewInit, OnDestroy {

  @HostListener('window:keyup', ['$event']) keyEvent(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.onClose();
    }
  }

  @ViewChild('searchElement') searchElement: ElementRef;
  @Output() close = new EventEmitter();

  query = '';
  results: GlobalSearchResult[] = [];
  activeIndex = 0;

  // [ngClass.lt-md] => [class.app-search__result--xs]="ltMd" (matchMedia natif).
  public ltMd = false;
  private mqlLtMd?: MediaQueryList;
  private readonly onLtMdChange = (e: MediaQueryListEvent) => { this.ltMd = e.matches; };

  constructor(
    @Inject(PLATFORM_ID) private readonly platformId: object,
    private readonly store: Store,
    private readonly router: Router,
    private readonly translate: TranslateService,
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const mql = window.matchMedia('(max-width: 959.98px)');
      this.ltMd = mql.matches;
      mql.addEventListener('change', this.onLtMdChange);
      this.mqlLtMd = mql;
    }
    this.runSearch('');
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.searchElement?.nativeElement?.focus(), 200);
  }

  ngOnDestroy(): void {
    this.mqlLtMd?.removeEventListener('change', this.onLtMdChange);
  }

  get activeResult(): GlobalSearchResult | null {
    return this.results[this.activeIndex] ?? null;
  }

  onInput(value: string): void {
    this.query = value;
    this.runSearch(value);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeIndex = Math.min(this.activeIndex + 1, this.results.length - 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeIndex = Math.max(this.activeIndex - 1, 0);
    } else if (event.key === 'Enter' && this.activeResult) {
      event.preventDefault();
      this.open(this.activeResult);
    }
  }

  open(result: GlobalSearchResult): void {
    this.router.navigate(['/', currentAppLanguage(), ...result.route], result.fragment ? { fragment: result.fragment } : {});
    this.onClose();
  }

  kindLabelKey(kind: GlobalSearchResult['kind']): string {
    return `GLOBAL_SEARCH.KINDS.${kind.toUpperCase()}`;
  }

  trackByResult(_: number, result: GlobalSearchResult): string {
    return `${result.kind}:${result.route.join('/')}:${result.label}`;
  }

  onClose() {
    this.close.next(true);
  }

  private runSearch(raw: string): void {
    const q = normalize(raw);
    const matches = (...values: (string | undefined | null)[]) =>
      !q || values.some((v) => normalize(v).includes(q));

    const properties = this.store.selectSnapshot(PropertyState.selectStateProperties) || [];
    const rooms = this.store.selectSnapshot(RoomState.selectStateRooms) || [];
    const tenants = this.store.selectSnapshot(LocataireState.selectStateLocataires) || [];
    const propertyName = (id: any) => properties.find((p: any) => p._id === String(id?._id ?? id))?.name || '';

    const results: GlobalSearchResult[] = [];
    for (const page of APP_PAGES) {
      const label = this.translate.instant(page.labelKey);
      if (matches(label, page.keywords)) results.push({ kind: 'page', label, route: page.route });
    }
    for (const p of properties as any[]) {
      if (matches(p.name, p.location)) {
        results.push({ kind: 'property', label: p.name, detail: p.location, route: ['app', 'properties', 'details', p._id] });
      }
    }
    if (q) {
      for (const r of rooms as any[]) {
        const pid = String(r.property?._id ?? r.property ?? '');
        if (pid && matches(r.code, r.type)) {
          results.push({ kind: 'unit', label: r.code || r.type, detail: propertyName(pid), route: ['app', 'properties', 'details', pid], fragment: 'units' });
        }
      }
      for (const t of tenants as any[]) {
        const pid = String(t.property?._id ?? t.property ?? '');
        const name = t.fullName || t.fullNameRef;
        if (pid && matches(name, t.phoneNumber, t.phoneNumberRef, t.email)) {
          results.push({ kind: 'tenant', label: name, detail: propertyName(pid), route: ['app', 'properties', 'details', pid], fragment: 'tenants' });
        }
      }
    }
    this.results = results.slice(0, MAX_RESULTS);
    this.activeIndex = 0;
  }
}

function normalize(value: unknown): string {
  return String(value ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}

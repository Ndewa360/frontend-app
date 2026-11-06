import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { RoomModel, RoomType } from '../../store/rooms/room.model';
import { PropertyModel, PropertyService, RoomService } from '../../store';

export interface PageMetaData {
  title: string;
  description: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  lang?: string;
}

interface RoomWithProperty {
  room: RoomModel;
  property: PropertyModel;
}

const BASE_URL = 'https://ndewa-360.com';
const DEFAULT_IMAGE = `${BASE_URL}/assets/img/logo/logo-basic.png`;

@Injectable({ providedIn: 'root' })
export class SeoService {

  private publicRoutes = [
    '/',
    '/search/index',
    '/search/room',
    '/search/property',
    '/support'
  ];

  constructor(
    private titleService: Title,
    private meta: Meta,
    private roomService: RoomService,
    private propertyService: PropertyService,
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(DOCUMENT) private document: Document,
  ) {}

  // ── Méthode principale appelée par AppComponent sur chaque navigation ──────

  needsMetaTags(url: string): boolean {
    // Supprimer le préfixe de langue (/fr/ ou /en/) avant de comparer
    const stripped = url.replace(/^\/[a-z]{2}(\/|$)/, '/');
    return this.publicRoutes.some(route =>
      stripped === route ||
      stripped.startsWith(route + '/') ||
      stripped.startsWith(route + '?')
    ) || url === '/';
  }

  updateMetaTagsForRoute(url: string): void {
    this.clearMetaTags();

    // Séparer path et query string
    const [path, queryString] = url.split('?');
    const params = new URLSearchParams(queryString || '');
    const unitId = params.get('unit');

    // Détecter la langue depuis l'URL (/fr/... ou /en/...)
    const langMatch = url.match(/^\/(fr|en)\//);
    const lang = (langMatch ? langMatch[1] : 'fr') as 'fr' | 'en';

    // Pages précises d'abord : « /home/about » contient aussi « /home » et
    // recevait les métadonnées de l'accueil.
    if (path.includes('/home/tarifs')) {
      this.setupPricingPageMetaTags(lang, params.get('profil'));
    } else if (path.includes('/support')) {
      this.setupSupportPageMetaTags(lang, path, params.get('article'));
    } else if (path.includes('/home/about')) {
      this.setupAboutPageMetaTags(lang);
    } else if (path.includes('/home/contact')) {
      this.setupContactPageMetaTags(lang);
    } else if (path.includes('/home/privacy-policy')) {
      this.setupPrivacyPageMetaTags(lang);
    } else if (path.includes('/home/terms')) {
      this.setupTermsPageMetaTags(lang);
    } else if (path.includes('/home')) {
      this.setLandingPageSeo(lang);
    } else if (path.includes('/search/room/')) {
      const roomId = path.split('/search/room/')[1];
      if (roomId) this.setupRoomPageMetaTags(roomId, lang);
      else this.setSearchPageSeo(lang);
    } else if (path.includes('/search/property/')) {
      const propertyId = path.split('/search/property/')[1];
      if (propertyId) this.setupPropertyDetailPageMetaTags(propertyId);
      else this.setupPropertyPageMetaTags();
    } else if (path.includes('/search/property')) {
      this.setupPropertyPageMetaTags();
    } else if (path.includes('/search')) {
      // ?unit=<id> → meta tags de l'unité spécifique
      if (unitId) this.setupRoomPageMetaTags(unitId, lang);
      else this.setSearchPageSeo(lang);
    } else if (url === '/') {
      this.setLandingPageSeo(lang);
    }
  }

  // ── Landing page — avec support FR/EN ─────────────────────────────────────

  setLandingPageSeo(lang: 'fr' | 'en'): void {
    const isFr = lang === 'fr';
    const canonicalUrl = `${BASE_URL}/${lang}/home`;

    this.apply({
      title: isFr
        ? 'Ndewa360 — Gestion immobilière locative intelligente en Afrique'
        : 'Ndewa360 — Smart Rental Property Management in Africa',
      description: isFr
        ? 'Ndewa360 simplifie la gestion de vos biens locatifs : suivi des loyers, contrats automatiques, locataires, paiements Mobile Money. Plateforme No1 de gestion immobilière en Afrique francophone.'
        : 'Ndewa360 simplifies rental property management: rent tracking, automatic contracts, tenant management, Mobile Money payments. #1 property management platform in francophone Africa.',
      keywords: isFr
        ? 'gestion immobilière, gestion locative, loyer, locataire, contrat location, Cameroun, Afrique, Mobile Money, propriétaire, agent immobilier, chambre à louer Douala, appartement Yaoundé'
        : 'property management, rental management, rent, tenant, lease contract, Cameroon, Africa, Mobile Money, landlord, real estate agent, room for rent Douala',
      ogTitle: isFr
        ? 'Ndewa360 — Gérez vos loyers et locataires en toute simplicité'
        : 'Ndewa360 — Manage your rents and tenants effortlessly',
      ogDescription: isFr
        ? 'Plateforme de gestion immobilière. Suivi des paiements, contrats PDF, alertes automatiques, visites 360°. Gratuit pour 1 bien et 4 logements occupés.'
        : 'Rental property management platform. Payment tracking, PDF contracts, automatic alerts, 360° tours. Free for 1 property and 4 occupied units.',
      ogImage: DEFAULT_IMAGE,
      ogUrl: canonicalUrl,
      lang,
    }, canonicalUrl, this.getLandingStructuredData(isFr));
  }

  // ── Page de recherche — avec support FR/EN ─────────────────────────────────

  setSearchPageSeo(lang: 'fr' | 'en'): void {
    const isFr = lang === 'fr';
    const canonicalUrl = `${BASE_URL}/${lang}/search/index`;

    this.apply({
      title: isFr
        ? 'Rechercher un logement — Ndewa360 | Appartements et chambres en Afrique'
        : 'Search Housing — Ndewa360 | Apartments and rooms in Africa',
      description: isFr
        ? 'Trouvez votre logement parmi des centaines d\'annonces vérifiées. Visites 360° gratuites, filtres avancés, contact propriétaire direct. Recherche gratuite.'
        : 'Find your housing among hundreds of verified listings. Free 360° tours, advanced filters, direct owner contact. Free search.',
      keywords: isFr
        ? 'recherche logement, location Cameroun, chambres étudiants, appartements, filtres, prix, localisation, Douala, Yaoundé'
        : 'housing search, rental Cameroon, student rooms, apartments, filters, price, location',
      ogTitle: isFr
        ? 'Trouver un logement en Afrique — Ndewa360'
        : 'Find Housing in Africa — Ndewa360',
      ogDescription: isFr
        ? 'Annonces vérifiées, visites 360° gratuites, contact propriétaire à 1000 FCFA pour 24 heures.'
        : 'Verified listings, free 360° tours, owner contact for 1000 FCFA for 24 hours.',
      ogImage: DEFAULT_IMAGE,
      ogUrl: canonicalUrl,
      lang,
    }, canonicalUrl);
  }

  // ── Méthodes existantes conservées (room, property, support) ──────────────

  setupLandingPageMetaTags(): void {
    this.setLandingPageSeo('fr');
  }

  setupSearchPageMetaTags(): void {
    this.setSearchPageSeo('fr');
  }

  setupRoomPageMetaTags(roomId: string, lang: 'fr' | 'en' = 'fr'): void {
    this.getRoomWithPropertyDetails(roomId).subscribe(data => {
      if (!data?.room) { this.setSearchPageSeo(lang); return; }
      const { room, property } = data;
      // URL canonique : pointe vers la page search avec le paramètre unit
      const roomUrl = `${BASE_URL}/${lang}/search/index?unit=${roomId}`;
      const mainImage = room.image || (room.medias?.length > 0 ? room.medias[0] : DEFAULT_IMAGE);
      const roomTypeText = this.getRoomTypeText(room.type);
      const isFr = lang === 'fr';
      let title = `${roomTypeText} ${room.code} — ${room.price} FCFA`;
      if (property?.location) title += ` à ${property.location}`;
      title += ` | Ndewa360`;
      const description = this.generateRoomDescription(room, property, isFr);
      let keywords = `location, ${roomTypeText}, ${room.code}, ${room.price} FCFA, logement, immobilier, Ndewa360`;
      if (property) {
        keywords += `, ${property.location}`;
        if (property.geolocationCity?.fullName) keywords += `, ${property.geolocationCity.fullName}`;
      }
      this.apply({
        title,
        description,
        keywords,
        ogTitle: title,
        ogDescription: description,
        ogImage: mainImage,
        ogUrl: roomUrl,
        lang
      }, roomUrl);
      this.addStructuredData({
        '@context': 'https://schema.org',
        '@type': 'Apartment',
        'name': `${roomTypeText} ${room.code}`,
        'description': room.description || description,
        'url': roomUrl,
        'image': mainImage,
        'numberOfRooms': room.specifity?.numberOfLivingRoom || 1,
        'amenityFeature': this.generateAmenityFeatures(room),
        'offers': {
          '@type': 'Offer',
          'price': room.price,
          'priceCurrency': 'XAF',
          'availability': room.isFree ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
        },
        ...(property ? {
          'address': {
            '@type': 'PostalAddress',
            'addressLocality': property.geolocationCity?.fullName || property.location,
            'addressRegion': property.location,
            'addressCountry': property.geolocationCountry?.fullName || 'Cameroun',
          },
        } : {}),
      });
    });
  }

  setupPropertyPageMetaTags(): void {
    this.apply({
      title: 'Détails du logement | Ndewa360',
      description: 'Découvrez ce logement en détail avec visite virtuelle 360°, photos, caractéristiques et informations de contact.',
      keywords: 'détail logement, visite virtuelle, 360°, photos, caractéristiques, contact propriétaire',
      ogUrl: `${BASE_URL}/search/property`,
    }, `${BASE_URL}/search/property`);
  }

  setupPropertyDetailPageMetaTags(propertyId: string): void {
    this.getPropertyDetails(propertyId).subscribe(property => {
      if (!property) { this.setupPropertyPageMetaTags(); return; }
      const propertyUrl = `${BASE_URL}/search/property/${propertyId}`;
      const mainImage = property.image || (property.medias?.length > 0 ? property.medias[0] : DEFAULT_IMAGE);
      let title = property.name;
      if (property.location) {
        title += ` à ${property.location}`;
        if (property.geolocationCity?.fullName) title += `, ${property.geolocationCity.fullName}`;
      }
      title += ` | Ndewa360`;
      let description = `${property.name} situé(e) à ${property.location}`;
      if (property.geolocationCity?.fullName) description += `, ${property.geolocationCity.fullName}`;
      if (property.description) description += `. ${property.description.substring(0, 150)}`;
      if (property.roomLength) description += `. ${property.roomLength} unité(s) disponible(s).`;
      const keywords = [
        'propriété', property.name, property.location,
        property.geolocationCity?.fullName, property.geolocationCountry?.fullName,
        'logement', 'immobilier', 'Ndewa360',
      ].filter(Boolean).join(', ');
      this.apply({ title, description, keywords, ogImage: mainImage, ogUrl: propertyUrl }, propertyUrl);
    });
  }

  /**
   * Pages du support (accessibles sans connexion) : titre et description
   * propres à chaque page, en français et en anglais, adresse canonique réelle
   * (« /support » seul n'existe pas). Un article de documentation a sa propre
   * adresse (?article=…).
   */
  setupSupportPageMetaTags(lang: 'fr' | 'en' = 'fr', path = '', article?: string | null): void {
    const isFr = lang === 'fr';
    const page = (path.split('/support/')[1] || 'welcome').split('/')[0];
    const pages: Record<string, { fr: [string, string]; en: [string, string] }> = {
      welcome: {
        fr: ['Centre d\'aide Ndewa360 — Support, FAQ et documentation', 'Centre d\'aide de Ndewa360 : guides vidéo, questions fréquentes, documentation pas à pas et contact du support (WhatsApp, e-mail) pour gérer vos biens, locataires et loyers.'],
        en: ['Ndewa360 Help Center — Support, FAQ and documentation', 'Ndewa360 help center: video guides, FAQ, step-by-step documentation and support contact (WhatsApp, email) to manage your properties, tenants and rent.'],
      },
      faq: {
        fr: ['Questions fréquentes — Ndewa360', 'Réponses aux questions sur Ndewa360 : tarifs (gratuit pour 1 bien et 4 logements occupés, Pro de 3 000 à 20 000 FCFA/mois), loyers, reçus, contrats, agents, visites 360° et support.'],
        en: ['Frequently asked questions — Ndewa360', 'Answers about Ndewa360: pricing (free for 1 property and 4 occupied units, Pro from 3,000 to 20,000 FCFA/month), rent, receipts, contracts, agents, 360° tours and support.'],
      },
      manual: {
        fr: ['Documentation Ndewa360 — Guides pas à pas', 'Documentation de Ndewa360 : ajouter un bien et des logements, assigner un locataire, enregistrer un loyer, reçus, portefeuille, abonnement et gestionnaires.'],
        en: ['Ndewa360 Documentation — Step-by-step guides', 'Ndewa360 documentation: add a property and units, assign a tenant, record rent, receipts, wallet, subscription and managers.'],
      },
      'getting-started': {
        fr: ['Guide de démarrage — Ndewa360', 'Vidéos et étapes pour démarrer avec Ndewa360 : création de compte, ajout d\'un bien, d\'une unité et d\'un locataire, assignation et analyse financière.'],
        en: ['Getting started — Ndewa360', 'Videos and steps to get started with Ndewa360: account creation, adding a property, a unit and a tenant, assignment and financial analysis.'],
      },
      support: {
        fr: ['Contacter le support — Ndewa360', 'Contactez le support Ndewa360 : formulaire, WhatsApp +237 698 29 53 68 ou support@ndewa-360.com. Assistance gratuite en français.'],
        en: ['Contact support — Ndewa360', 'Contact Ndewa360 support: form, WhatsApp +237 698 29 53 68 or support@ndewa-360.com. Free assistance in French and English.'],
      },
    };
    const known = pages[page] ?? pages['welcome'];
    const [title, description] = isFr ? known.fr : known.en;
    const query = page === 'manual' && article ? `?article=${encodeURIComponent(article)}` : '';
    const canonicalUrl = `${BASE_URL}/${lang}/support/${pages[page] ? page : 'welcome'}${query}`;
    this.apply({
      title,
      description,
      keywords: isFr
        ? 'aide Ndewa360, support, FAQ, documentation, gestion locative, loyer, locataire, reçu, contrat de location, Cameroun'
        : 'Ndewa360 help, support, FAQ, documentation, rental management, rent, tenant, receipt, lease, Cameroon',
      ogUrl: canonicalUrl,
      lang,
    }, canonicalUrl);
  }

  /** Page Tarifs, par profil (?profil=proprietaire|agent|chercheur). */
  setupPricingPageMetaTags(lang: 'fr' | 'en', profile?: string | null): void {
    const isFr = lang === 'fr';
    const query = profile && ['proprietaire', 'agent', 'chercheur'].includes(profile) ? `?profil=${profile}` : '';
    const canonicalUrl = `${BASE_URL}/${lang}/home/tarifs${query}`;
    this.apply({
      title: isFr ? 'Tarifs Ndewa360 — Propriétaires, agents et chercheurs de logement' : 'Ndewa360 pricing — Owners, agents and home seekers',
      description: isFr
        ? 'Tarifs Ndewa360 : gratuit pour 1 bien et 4 logements occupés, forfait Pro de 3 000 à 20 000 FCFA/mois selon les loyers, Gold sur mesure. Recherche gratuite, contacts propriétaires 1 000 FCFA / 24 h.'
        : 'Ndewa360 pricing: free for 1 property and 4 occupied units, Pro plan from 3,000 to 20,000 FCFA/month based on rent, tailored Gold. Free search, owner contacts 1,000 FCFA / 24 h.',
      keywords: isFr
        ? 'tarif Ndewa360, prix gestion locative, abonnement, forfait Pro, Gold, gratuit, agent immobilier, chercheur de logement, FCFA'
        : 'Ndewa360 pricing, rental management price, subscription, Pro plan, Gold, free, real estate agent, home seeker, FCFA',
      ogUrl: canonicalUrl,
      lang,
    }, canonicalUrl, {
      '@context': 'https://schema.org',
      '@type': 'Product',
      'name': 'Ndewa360 — Loyers sous contrôle',
      'brand': { '@type': 'Brand', 'name': 'Ndewa360' },
      'offers': [
        { '@type': 'Offer', 'name': isFr ? 'Gratuit' : 'Free', 'price': '0', 'priceCurrency': 'XAF' },
        { '@type': 'AggregateOffer', 'name': 'Pro', 'lowPrice': '3000', 'highPrice': '20000', 'priceCurrency': 'XAF' },
        { '@type': 'Offer', 'name': isFr ? 'Accès coordonnées propriétaires (24 h)' : 'Owner contact access (24 h)', 'price': '1000', 'priceCurrency': 'XAF' },
      ],
    });
  }

  setupAboutPageMetaTags(lang: 'fr' | 'en'): void {
    const isFr = lang === 'fr';
    const canonicalUrl = `${BASE_URL}/${lang}/home/about`;
    this.apply({
      title: isFr ? 'À propos de Ndewa360 — Gestion immobilière en Afrique' : 'About Ndewa360 — Property Management in Africa',
      description: isFr
        ? 'Découvrez l\'histoire et la mission de Ndewa360, la plateforme de gestion immobilière locative en Afrique francophone.'
        : 'Discover the story and mission of Ndewa360, the rental property management platform in francophone Africa.',
      ogUrl: canonicalUrl,
      lang,
    }, canonicalUrl);
  }

  setupContactPageMetaTags(lang: 'fr' | 'en'): void {
    const isFr = lang === 'fr';
    const canonicalUrl = `${BASE_URL}/${lang}/home/contact`;
    this.apply({
      title: isFr ? 'Contactez Ndewa360 — Support & Assistance' : 'Contact Ndewa360 — Support & Assistance',
      description: isFr
        ? 'Contactez l\'équipe Ndewa360 pour toute question sur la gestion immobilière, les abonnements ou le support technique.'
        : 'Contact the Ndewa360 team for any question about property management, subscriptions or technical support.',
      ogUrl: canonicalUrl,
      lang,
    }, canonicalUrl);
  }

  setupPrivacyPageMetaTags(lang: 'fr' | 'en'): void {
    const isFr = lang === 'fr';
    const canonicalUrl = `${BASE_URL}/${lang}/home/privacy-policy`;
    this.apply({
      title: isFr ? 'Politique de confidentialité | Ndewa360' : 'Privacy Policy | Ndewa360',
      description: isFr
        ? 'Consultez la politique de confidentialité de Ndewa360 : collecte, utilisation et protection de vos données personnelles.'
        : 'Read Ndewa360\'s privacy policy: collection, use and protection of your personal data.',
      ogUrl: canonicalUrl,
      lang,
    }, canonicalUrl);
  }

  setupTermsPageMetaTags(lang: 'fr' | 'en'): void {
    const isFr = lang === 'fr';
    const canonicalUrl = `${BASE_URL}/${lang}/home/terms`;
    this.apply({
      title: isFr ? 'Conditions d\'utilisation | Ndewa360' : 'Terms of Service | Ndewa360',
      description: isFr
        ? 'Lisez les conditions générales d\'utilisation de la plateforme Ndewa360 avant d\'utiliser nos services.'
        : 'Read the terms of service of the Ndewa360 platform before using our services.',
      ogUrl: canonicalUrl,
      lang,
    }, canonicalUrl);
  }

  // ── Méthodes utilitaires ───────────────────────────────────────────────────

  clearMetaTags(): void {
    this.meta.removeTag("name='description'");
    this.meta.removeTag("name='keywords'");
    this.meta.removeTag("name='language'");
    this.meta.removeTag("name='robots'");
    this.meta.removeTag("property='og:title'");
    this.meta.removeTag("property='og:description'");
    this.meta.removeTag("property='og:url'");
    this.meta.removeTag("property='og:image'");
    this.meta.removeTag("property='og:type'");
    this.meta.removeTag("property='og:site_name'");
    this.meta.removeTag("property='og:locale'");
    this.meta.removeTag("name='twitter:card'");
    this.meta.removeTag("name='twitter:title'");
    this.meta.removeTag("name='twitter:description'");
    this.meta.removeTag("name='twitter:image'");
    this.removeStructuredData();
  }

  /**
   * Données structurées (JSON-LD) dans le <head>, y compris au rendu serveur :
   * une balise <script type="application/ld+json"> est lue par les moteurs de
   * recherche (l'ancienne balise <meta name="ld+json"> du rendu serveur ne
   * l'était pas). [slot] distingue les données d'une page (« main », remplacées
   * à chaque navigation) de celles d'un composant (« faq »).
   */
  addStructuredData(data: any, slot = 'main'): void {
    const head = this.document?.head;
    if (!head) return;
    this.removeStructuredData(slot);
    const script = this.document.createElement('script');
    script.id = this.structuredDataId(slot);
    script.setAttribute('type', 'application/ld+json');
    // « </ » échappé : un texte saisi ne peut pas fermer la balise script.
    script.textContent = JSON.stringify(data).replace(/<\//g, '<\\/');
    head.appendChild(script);
  }

  removeStructuredData(slot = 'main'): void {
    this.document?.getElementById(this.structuredDataId(slot))?.remove();
  }

  private structuredDataId(slot: string): string {
    return slot === 'main' ? 'structured-data' : `structured-data-${slot}`;
  }

  getPropertyDetails(propertyId: string): Observable<PropertyModel> {
    return this.propertyService.getProperty(propertyId).pipe(
      map(r => r.data),
      catchError(() => of(null))
    );
  }

  getRoomWithPropertyDetails(roomId: string): Observable<RoomWithProperty | null> {
    return this.roomService.getRoom(roomId).pipe(
      switchMap(r => {
        if (!r?.data) return of(null);
        return this.propertyService.getProperty(r.data.property).pipe(
          map(p => ({ room: r.data, property: p?.data || null })),
          catchError(() => of({ room: r.data, property: null }))
        );
      }),
      catchError(() => of(null))
    );
  }

  // ── Méthode centrale d'application des meta tags ──────────────────────────

  private apply(config: PageMetaData, canonicalUrl: string, structuredData?: any): void {
    this.titleService.setTitle(config.title);

    this.meta.updateTag({ name: 'description', content: config.description });
    this.meta.updateTag({ name: 'robots', content: 'index, follow' });
    if (config.keywords) this.meta.updateTag({ name: 'keywords', content: config.keywords });
    if (config.lang)     this.meta.updateTag({ name: 'language', content: config.lang });

    // Open Graph
    this.meta.updateTag({ property: 'og:type',        content: 'website' });
    this.meta.updateTag({ property: 'og:site_name',   content: 'Ndewa360' });
    this.meta.updateTag({ property: 'og:title',       content: config.ogTitle || config.title });
    this.meta.updateTag({ property: 'og:description', content: config.ogDescription || config.description });
    this.meta.updateTag({ property: 'og:url',         content: canonicalUrl });
    this.meta.updateTag({ property: 'og:image',       content: config.ogImage || DEFAULT_IMAGE });
    if (config.lang) {
      this.meta.updateTag({ property: 'og:locale', content: config.lang === 'fr' ? 'fr_FR' : 'en_US' });
    }

    // Twitter Card
    this.meta.updateTag({ name: 'twitter:card',        content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title',       content: config.ogTitle || config.title });
    this.meta.updateTag({ name: 'twitter:description', content: config.ogDescription || config.description });
    this.meta.updateTag({ name: 'twitter:image',       content: config.ogImage || DEFAULT_IMAGE });

    // Canonique et versions FR/EN : balises <link>, au rendu serveur comme
    // dans le navigateur (au rendu serveur, seule une balise meta non
    // standard était posée).
    this.setCanonical(canonicalUrl);
    this.setAlternates(canonicalUrl);
    if (structuredData) this.addStructuredData(structuredData);
  }

  private setCanonical(url: string): void {
    this.setLink('canonical', url);
  }

  /** <link rel="alternate" hreflang="fr|en|x-default"> de la page courante. */
  private setAlternates(canonicalUrl: string): void {
    const match = canonicalUrl.match(/^(https?:\/\/[^/]+)\/(fr|en)(\/.*)?$/);
    this.document?.head?.querySelectorAll('link[rel="alternate"][hreflang]').forEach((el) => el.remove());
    if (!match) return;
    const [, origin, , rest = ''] = match;
    for (const lang of ['fr', 'en']) this.setLink('alternate', `${origin}/${lang}${rest}`, lang);
    this.setLink('alternate', `${origin}/fr${rest}`, 'x-default');
  }

  private setLink(rel: string, href: string, hreflang?: string): void {
    const head = this.document?.head;
    if (!head) return;
    const selector = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]:not([hreflang])`;
    let link = head.querySelector(selector) as HTMLLinkElement | null;
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', rel);
      if (hreflang) link.setAttribute('hreflang', hreflang);
      head.appendChild(link);
    }
    link.setAttribute('href', href);
  }

  private getLandingStructuredData(isFr: boolean): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      'name': 'Ndewa360',
      'url': BASE_URL,
      'description': isFr
        ? 'Plateforme SaaS de gestion immobilière locative en Afrique francophone.'
        : 'SaaS rental property management platform in francophone Africa.',
      'applicationCategory': 'BusinessApplication',
      'operatingSystem': 'Web, iOS, Android',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'XAF',
        'description': isFr
          ? 'Gratuit pour 1 bien et 4 logements occupés. Pro à prix fixe de 3 000 à 20 000 FCFA/mois selon les loyers. Gold sur mesure.'
          : 'Free for 1 property and 4 occupied units. Pro at a fixed 3,000 to 20,000 FCFA/month based on rent. Custom Gold plan.',
      },
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': '4.9',
        'reviewCount': '20',
        'bestRating': '5',
      },
      'publisher': {
        '@type': 'Organization',
        'name': 'Ndewa360',
        'url': BASE_URL,
        'logo': DEFAULT_IMAGE,
        'sameAs': [
          'https://www.facebook.com/people/Ndewa360/61568162848247',
          'https://www.tiktok.com/@ndewa360',
          'https://www.instagram.com/ndewa.360',
        ],
      },
    };
  }

  private getRoomTypeText(type: RoomType): string {
    switch (type) {
      case RoomType.ROOM:               return 'Chambre';
      case RoomType.STUDIO:             return 'Studio';
      case RoomType.SIMPLE_APARTMENT:   return 'Appartement';
      case RoomType.FURNISHED_APARTMENT:return 'Appartement meublé';
      default:                          return 'Logement';
    }
  }

  private generateRoomDescription(room: RoomModel, property?: PropertyModel, isFr = true): string {
    const roomType = this.getRoomTypeText(room.type);
    let desc = isFr
      ? `${roomType} ${room.code} à louer`
      : `${roomType} ${room.code} for rent`;
    if (property) {
      desc += isFr ? ` à ${property.location}` : ` in ${property.location}`;
      if (property.geolocationCity?.fullName) desc += `, ${property.geolocationCity.fullName}`;
    }
    desc += isFr ? `. Prix : ${room.price} FCFA/mois` : `. Price: ${room.price} FCFA/month`;
    if (room.description) desc += `. ${room.description.substring(0, 100)}`;
    if (room.specifity) {
      const specs = [];
      if (room.specifity.numberOfBathroom) specs.push(`${room.specifity.numberOfBathroom} SDB`);
      if (room.specifity.numberOfLivingRoom) specs.push(`${room.specifity.numberOfLivingRoom} salon(s)`);
      if (specs.length > 0) desc += ` ${specs.join(', ')}.`;
    }
    return desc;
  }

  private generateAmenityFeatures(room: RoomModel): any[] {
    const amenities = [];
    if (!room.specifity) return amenities;
    if (room.specifity.hasKitchen) {
      amenities.push({ '@type': 'LocationFeatureSpecification', 'name': 'Cuisine', 'value': room.specifity.isInternalKitchen ? 'Interne' : 'Externe' });
    }
    if (room.specifity.numberOfBathroom) {
      amenities.push({ '@type': 'LocationFeatureSpecification', 'name': 'Salle de bain', 'value': room.specifity.numberOfBathroom });
    }
    if (room.specifity.numberOfShower) {
      amenities.push({ '@type': 'LocationFeatureSpecification', 'name': 'Douche', 'value': `${room.specifity.numberOfShower} ${room.specifity.isInternalShower ? 'interne(s)' : 'externe(s)'}` });
    }
    if (room.specifity.numberOfLivingRoom) {
      amenities.push({ '@type': 'LocationFeatureSpecification', 'name': 'Salon', 'value': room.specifity.numberOfLivingRoom });
    }
    return amenities;
  }
}

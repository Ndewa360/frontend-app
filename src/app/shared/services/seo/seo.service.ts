import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { isPlatformBrowser } from '@angular/common';
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

const BASE_URL = 'https://ndewa360.com';
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
  ) {}

  // ── Méthode principale appelée par AppComponent sur chaque navigation ──────

  needsMetaTags(url: string): boolean {
    return this.publicRoutes.some(route =>
      url === route ||
      url.startsWith(route + '/') ||
      url.startsWith(route + '?')
    );
  }

  updateMetaTagsForRoute(url: string): void {
    this.clearMetaTags();
    if (!this.needsMetaTags(url)) return;

    // Détecter la langue depuis l'URL (/fr/... ou /en/...)
    const langMatch = url.match(/^\/(fr|en)\//);
    const lang = (langMatch ? langMatch[1] : 'fr') as 'fr' | 'en';

    if (url.includes('/home') && !url.includes('/home/')) {
      this.setLandingPageSeo(lang);
    } else if (url.includes('/search/index') || url === '/') {
      this.setSearchPageSeo(lang);
    } else if (url.includes('/search/room/')) {
      const roomId = url.split('/search/room/')[1]?.split('?')[0];
      if (roomId) this.setupRoomPageMetaTags(roomId);
      else this.setSearchPageSeo(lang);
    } else if (url.includes('/search/property/')) {
      const propertyId = url.split('/search/property/')[1]?.split('?')[0];
      if (propertyId) this.setupPropertyDetailPageMetaTags(propertyId);
      else this.setupPropertyPageMetaTags();
    } else if (url.includes('/search/property')) {
      this.setupPropertyPageMetaTags();
    } else if (url.includes('/support')) {
      this.setupSupportPageMetaTags();
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
        ? 'Plateforme SaaS de gestion immobilière. Suivi des paiements, contrats PDF, alertes automatiques, visites 360°. Gratuit jusqu\'à 8 biens.'
        : 'SaaS rental property management. Payment tracking, PDF contracts, automatic alerts, 360° tours. Free up to 8 properties.',
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
        ? 'Annonces vérifiées, visites 360° gratuites, contact propriétaire à 500 FCFA.'
        : 'Verified listings, free 360° tours, owner contact for 500 FCFA.',
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

  setupRoomPageMetaTags(roomId: string): void {
    this.getRoomWithPropertyDetails(roomId).subscribe(data => {
      if (!data?.room) { this.setSearchPageSeo('fr'); return; }
      const { room, property } = data;
      const roomUrl = `${BASE_URL}/search/room/${roomId}`;
      const mainImage = room.image || (room.medias?.length > 0 ? room.medias[0] : DEFAULT_IMAGE);
      const roomTypeText = this.getRoomTypeText(room.type);
      let title = `${roomTypeText} ${room.code} - ${room.price} FCFA`;
      if (property?.location) title += ` à ${property.location}`;
      title += ` | Ndewa360`;
      const description = this.generateRoomDescription(room, property);
      let keywords = `location, ${roomTypeText}, ${room.code}, ${room.price} FCFA, logement, immobilier, Ndewa360`;
      if (property) {
        keywords += `, ${property.location}`;
        if (property.geolocationCity?.fullName) keywords += `, ${property.geolocationCity.fullName}`;
      }
      this.apply({ title, description, keywords, ogImage: mainImage, ogUrl: roomUrl }, roomUrl);
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

  setupSupportPageMetaTags(): void {
    this.apply({
      title: 'Support et aide | Ndewa360',
      description: 'Besoin d\'aide ? Consultez notre centre de support pour trouver des réponses à vos questions sur Ndewa360.',
      keywords: 'support, aide, FAQ, questions fréquentes, contact, assistance',
      ogUrl: `${BASE_URL}/support`,
    }, `${BASE_URL}/support`);
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
    if (isPlatformBrowser(this.platformId)) {
      document.getElementById('structured-data')?.remove();
    }
  }

  addStructuredData(data: any): void {
    if (!isPlatformBrowser(this.platformId)) return;
    document.getElementById('structured-data')?.remove();
    const script = document.createElement('script');
    script.id = 'structured-data';
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);
    document.head.appendChild(script);
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

    if (isPlatformBrowser(this.platformId)) {
      this.setCanonical(canonicalUrl);
      if (structuredData) this.addStructuredData(structuredData);
    }
  }

  private setCanonical(url: string): void {
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', url);
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
          ? 'Gratuit jusqu\'à 8 biens. Premium : 2% du loyer/unité occupée.'
          : 'Free up to 8 properties. Premium: 2% of rent/occupied unit.',
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

  private generateRoomDescription(room: RoomModel, property?: PropertyModel): string {
    const roomType = this.getRoomTypeText(room.type);
    let desc = `${roomType} ${room.code} à louer`;
    if (property) {
      desc += ` à ${property.location}`;
      if (property.geolocationCity?.fullName) desc += `, ${property.geolocationCity.fullName}`;
    }
    desc += `. Prix: ${room.price} FCFA/mois`;
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

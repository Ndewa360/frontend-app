// src/app/shared/services/seo/seo.service.ts
import { Injectable } from '@angular/core';
import { Title, Meta, DomSanitizer } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
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
}


interface RoomWithProperty {
  room: RoomModel;
  property: PropertyModel;
}


@Injectable({
  providedIn: 'root'
})
export class SeoService {
  // Pages qui nécessitent des métadonnées
  private publicRoutes = [
    '/',                  // Landing page
    '/search/index',      // Page de recherche
    '/search/room',       // Page d'unité locative (dynamique)
    '/search/property',   // Page d'affichage de propriété
    '/support'            // Module de support
  ];

  constructor(
    private titleService: Title,
    private meta: Meta,
    private roomService: RoomService,
    private propertyService:PropertyService,
    private sanitizer: DomSanitizer
  ) {}

  // Vérifie si la route actuelle nécessite des métadonnées
  needsMetaTags(url: string): boolean {
    return this.publicRoutes.some(route => 
      url === route || 
      url.startsWith(route + '/') || 
      url.startsWith(route + '?')
    );
  }

  // Mise à jour des métadonnées en fonction de la route
  updateMetaTagsForRoute(url: string): void {
    // Supprimer les métadonnées existantes
    this.clearMetaTags();
    
    // Si la route ne nécessite pas de métadonnées, on s'arrête là
    if (!this.needsMetaTags(url)) {
      return;
    }
    
    // Définir les métadonnées en fonction de la route
    if (url === '/' || url.startsWith('/?')) {
      this.setupLandingPageMetaTags();
    } else if (url.startsWith('/search/index')) {
      this.setupSearchPageMetaTags();
    } else if (url.startsWith('/search/room/')) {
      // Extraire l'ID de l'unité locative de l'URL
      const roomId = url.split('/').pop();
      if (roomId) {
        this.setupRoomPageMetaTags(roomId);
      } else {
        this.setupSearchPageMetaTags(); // Fallback
      }
    } else if (url.startsWith('/search/property/')) {
      // Extraire l'ID de la propriété de l'URL
      const propertyId = url.split('/').pop();
      if (propertyId) {
        this.setupPropertyDetailPageMetaTags(propertyId);
      } else {
        this.setupPropertyPageMetaTags(); // Fallback
      }
    } else if (url.startsWith('/search/property')) {
      this.setupPropertyPageMetaTags();
    } else if (url.startsWith('/support')) {
      this.setupSupportPageMetaTags();
    }
  }

  // Supprime toutes les métadonnées
  clearMetaTags(): void {
    this.meta.removeTag("name='description'");
    this.meta.removeTag("name='keywords'");
    this.meta.removeTag("property='og:title'");
    this.meta.removeTag("property='og:description'");
    this.meta.removeTag("property='og:url'");
    this.meta.removeTag("property='og:image'");
    this.meta.removeTag("name='twitter:title'");
    this.meta.removeTag("name='twitter:description'");
    this.meta.removeTag("name='twitter:image'");

     // Supprimer le script JSON-LD s'il existe
    const existingScript = document.getElementById('structured-data');
    if (existingScript) {
      existingScript.remove();
    }
  }

  // Ajoute des données structurées au format JSON-LD
  addStructuredData(data: any): void {
    const existingScript = document.getElementById('structured-data');
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.id = 'structured-data';
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);
    document.head.appendChild(script);
  }

   // Récupère les détails d'une propriété
  getPropertyDetails(propertyId: string): Observable<PropertyModel> {
    return this.propertyService.getProperty(propertyId).pipe(
          map(propertyResponse => propertyResponse.data ),
          catchError((error) => {
            console.error('Erreur lors de la récupération des détails de la propriété:', error);
            return of(null);
          })
        );
  }

  // Récupère les détails d'une unité locative et sa propriété associée
  getRoomWithPropertyDetails(roomId: string): Observable<RoomWithProperty | null> {
    return this.roomService.getRoom(roomId).pipe(
      switchMap(roomResponse => {
        if (!roomResponse || !roomResponse.data) {
          return of(null);
        }
        
        const room = roomResponse.data;
        
        // Récupérer les détails de la propriété associée
        return this.propertyService.getProperty(room.property).pipe(
          map(propertyResponse => {
            if (!propertyResponse || !propertyResponse.data) {
              return { room, property: null };
            }
            return { room, property: propertyResponse.data };
          }),
          catchError(() => {
            // Si on ne peut pas récupérer la propriété, on retourne juste la chambre
            return of({ room, property: null });
          })
        );
      }),
      catchError(error => {
        console.error('Erreur lors de la récupération des détails de l\'unité:', error);
        return of(null);
      })
    );
  }

  // Convertit le type de chambre en texte lisible
  private getRoomTypeText(type: RoomType): string {
    switch (type) {
      case RoomType.ROOM:
        return 'Chambre';
      case RoomType.STUDIO:
        return 'Studio';
      case RoomType.SIMPLE_APARTMENT:
        return 'Appartement';
      case RoomType.FURNISHED_APARTMENT:
        return 'Appartement meublé';
      default:
        return 'Logement';
    }
  }

  // Génère une description SEO à partir des détails de la chambre
  private generateRoomDescription(room: RoomModel, property?: PropertyModel): string {
    const roomType = this.getRoomTypeText(room.type);
    let description = `${roomType} ${room.code} à louer`;
    
    // Ajouter la localisation si disponible
    if (property) {
      description += ` à ${property.location}`;
      if (property.geolocationCity && property.geolocationCity?.fullName) {
        description += `, ${property.geolocationCity?.fullName}`;
      }
    }
    
    description += `. Prix: ${room.price} FCFA/mois`;
    
    if (room.description) {
      description += `. ${room.description.substring(0, 100)}`;
    }
    
    // Ajouter des détails sur les spécificités (version courte pour la description)
    if (room.specifity) {
      const specs = [];
      
      if (room.specifity.numberOfBathroom) {
        specs.push(`${room.specifity.numberOfBathroom} SDB`);
      }
      
      if (room.specifity.numberOfLivingRoom) {
        specs.push(`${room.specifity.numberOfLivingRoom} salon(s)`);
      }
      
      if (specs.length > 0) {
        description += ` ${specs.join(', ')}.`;
      }
    }
    
    return description;
  }

  // Métadonnées pour la page d'unité locative (dynamique)
  setupRoomPageMetaTags(roomId: string): void {
    this.getRoomWithPropertyDetails(roomId).subscribe(data => {
      if (!data || !data.room) {
        // Fallback si les détails de l'unité ne sont pas disponibles
        this.setupSearchPageMetaTags();
        return;
      }

      const { room, property } = data;
      
      // Construire l'URL complète
      const roomUrl = `https://ndewa-360.com/search/index?unit=${roomId}`;
      
      // Utiliser l'image principale ou la première des médias
      const mainImage = room.image || (room.medias && room.medias.length > 0 ? room.medias[0] : 'https://ndewa-360.com/assets/img/logo/logo-basic.png');
      
      // Obtenir le type de chambre en texte
      const roomTypeText = this.getRoomTypeText(room.type);
      
      // Titre optimisé pour le SEO
      let title = `${roomTypeText} ${room.code} - ${room.price} FCFA`;
      
      // Ajouter la localisation au titre si disponible
      if (property && property.location) {
        title += ` à ${property.location}`;
      }
      
      title += ` | Ndewa360`;
      
      // Description optimisée pour le SEO
      const description = this.generateRoomDescription(room, property);
      
      // Mots-clés optimisés pour le SEO
      let keywords = `location, ${roomTypeText}, ${room.code}, ${room.price} FCFA, logement, immobilier, Ndewa360`;
      
      if (property) {
        keywords += `, ${property.location}`;
        if (property.geolocationCity && property.geolocationCity.fullName) {
          keywords += `, ${property.geolocationCity.fullName}`;
        }
      }

      this.titleService.setTitle(title);
      this.meta.addTags([
        { name: 'description', content: description },
        { name: 'keywords', content: keywords },
        { name: 'author', content: 'Ndewa360' },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: roomUrl },
        { property: 'og:type', content: 'website' },
        { property: 'og:image', content: mainImage },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
        { name: 'twitter:image', content: mainImage }
      ]);

      // Ajouter des données structurées Schema.org pour l'immobilier
      const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Apartment',
        'name': `${roomTypeText} ${room.code}`,
        'description': room.description || description,
        'url': roomUrl,
        'image': mainImage,
        'numberOfRooms': room.specifity?.numberOfLivingRoom || 1,
        'floorSize': {
          '@type': 'QuantitativeValue',
          'unitText': 'm²'
          // 'value': room.size // Si vous avez cette information
        },
        'amenityFeature': this.generateAmenityFeatures(room),
        'offers': {
          '@type': 'Offer',
          'price': room.price,
          'priceCurrency': 'XAF',
          'availability': room.isFree ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut'
        }
      };

      // Ajouter les informations de localisation si disponibles
      if (property) {
        structuredData['address'] = {
          '@type': 'PostalAddress',
          'addressLocality': property.geolocationCity?.fullName || property.location,
          'addressRegion': property.location,
          'addressCountry': property.geolocationCountry?.fullName || 'Cameroun'
        };
        
        // Ajouter la propriété parente
        structuredData['containedInPlace'] = {
          '@type': 'Residence',
          'name': property.name,
          'description': property.description
        };
      }

      this.addStructuredData(structuredData);
    });
  }

  // Génère les caractéristiques d'aménagement pour les données structurées
  private generateAmenityFeatures(room: RoomModel): any[] {
    const amenities = [];
    
    if (room.specifity) {
      if (room.specifity.hasKitchen) {
        amenities.push({
          '@type': 'LocationFeatureSpecification',
          'name': 'Cuisine',
          'value': room.specifity.isInternalKitchen ? 'Interne' : 'Externe'
        });
      }
      
      if (room.specifity.numberOfBathroom) {
        amenities.push({
          '@type': 'LocationFeatureSpecification',
          'name': 'Salle de bain',
          'value': room.specifity.numberOfBathroom
        });
      }
      
      if (room.specifity.numberOfShower) {
        amenities.push({
          '@type': 'LocationFeatureSpecification',
          'name': 'Douche',
          'value': `${room.specifity.numberOfShower} ${room.specifity.isInternalShower ? 'interne(s)' : 'externe(s)'}`
        });
      }
      
      if (room.specifity.numberOfLivingRoom) {
        amenities.push({
          '@type': 'LocationFeatureSpecification',
          'name': 'Salon',
          'value': room.specifity.numberOfLivingRoom
        });
      }
    }
    
    return amenities;
  }

  // Métadonnées pour la page d'accueil
  setupLandingPageMetaTags(): void {
    this.titleService.setTitle('Ndewa360 - Gestion Immobilière Innovante & Visites 360° en Afrique');
    this.meta.addTags([
      { name: 'description', content: 'Simplifiez la gestion de vos biens immobiliers en Afrique. Suivi des loyers, génération de reçus automatiques et visites 360° pour la diaspora et les bailleurs.' },
      { name: 'keywords', content: 'location, logement, immobilier, Cameroun, 360°, étudiants, unités à louer, propriétaires, gestion immobilière' },
      { name: 'author', content: 'Ndewa360' },
      { property: 'og:title', content: 'Ndewa360 - Gestion Immobilière Innovante & Visites 360° en Afrique' },
      { property: 'og:description', content: 'Bailleurs, sécurisez vos revenus et gérez vos biens à distance. Locataires, visitez en 360° et trouvez votre logement gratuitement.' },
      { property: 'og:url', content: 'https://ndewa-360.com' },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: 'https://ndewa-360.com/assets/img/logo/logo-basic.png' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Ndewa360 - Gestion Immobilière Innovante & Visites 360° en Afrique' },
      { name: 'twitter:description', content: 'Bailleurs, sécurisez vos revenus et gérez vos biens à distance. Locataires, visitez en 360° et trouvez votre logement gratuitement.' },
      { name: 'twitter:image', content: 'https://ndewa-360.com/assets/img/logo/logo-basic.png' }
    ]);

    // Ajouter des données structurées pour l'organisation
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      'name': 'Ndewa360',
      'url': 'https://ndewa-360.com',
      'logo': 'https://ndewa-360.com/assets/img/logo/logo-basic.png',
      'description': 'Ndewa360 est une plateforme camerounaise qui permet de rechercher et gérer des logements grâce à des visites en 360°.',
      'sameAs': [
        'https://www.facebook.com/ndewa360',
        'https://www.instagram.com/ndewa360'
      ]
    };

    this.addStructuredData(structuredData);
  }

  // Métadonnées pour la page de recherche
  setupSearchPageMetaTags(): void {
    this.titleService.setTitle('Recherche de logements | Ndewa360');
    this.meta.addTags([
      { name: 'description', content: 'Trouvez le logement idéal parmi notre sélection de chambres, studios et appartements au Cameroun. Filtrez par prix, localisation et caractéristiques.' },
      { name: 'keywords', content: 'recherche logement, location Cameroun, chambres étudiants, appartements, filtres, prix, localisation' },
      { name: 'author', content: 'Ndewa360' },
      { property: 'og:title', content: 'Recherche de logements | Ndewa360' },
      { property: 'og:description', content: 'Trouvez le logement idéal parmi notre sélection de chambres, studios et appartements au Cameroun.' },
      { property: 'og:url', content: 'https://ndewa-360.com/search/index' },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: 'https://ndewa-360.com/assets/img/logo/logo-basic.png' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Recherche de logements | Ndewa360' },
      { name: 'twitter:description', content: 'Trouvez le logement idéal parmi notre sélection de chambres, studios et appartements au Cameroun.' },
      { name: 'twitter:image', content: 'https://ndewa-360.com/assets/img/logo/logo-basic.png' }
    ]);
  }

  // Métadonnées pour la page de propriété
  setupPropertyPageMetaTags(): void {
    this.titleService.setTitle('Détails du logement | Ndewa360');
    this.meta.addTags([
      { name: 'description', content: 'Découvrez ce logement en détail avec visite virtuelle 360°, photos, caractéristiques et informations de contact.' },
      { name: 'keywords', content: 'détail logement, visite virtuelle, 360°, photos, caractéristiques, contact propriétaire' },
      { name: 'author', content: 'Ndewa360' },
      { property: 'og:title', content: 'Détails du logement | Ndewa360' },
      { property: 'og:description', content: 'Découvrez ce logement en détail avec visite virtuelle 360°, photos et caractéristiques.' },
      { property: 'og:url', content: 'https://ndewa-360.com/search/property' },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: 'https://ndewa-360.com/assets/img/logo/logo-basic.png' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Détails du logement | Ndewa360' },
      { name: 'twitter:description', content: 'Découvrez ce logement en détail avec visite virtuelle 360°, photos et caractéristiques.' },
      { name: 'twitter:image', content: 'https://ndewa-360.com/assets/img/logo/logo-basic.png' }
    ]);
  }

  // Métadonnées pour la page de support
  setupSupportPageMetaTags(): void {
    this.titleService.setTitle('Support et aide | Ndewa360');
    this.meta.addTags([
      { name: 'description', content: 'Besoin d\'aide ? Consultez notre centre de support pour trouver des réponses à vos questions sur Ndewa360.' },
      { name: 'keywords', content: 'support, aide, FAQ, questions fréquentes, contact, assistance' },
      { name: 'author', content: 'Ndewa360' },
      { property: 'og:title', content: 'Support et aide | Ndewa360' },
      { property: 'og:description', content: 'Besoin d\'aide ? Consultez notre centre de support pour trouver des réponses à vos questions.' },
      { property: 'og:url', content: 'https://ndewa-360.com/support' },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: 'https://ndewa-360.com/assets/img/logo/logo-basic.png' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Support et aide | Ndewa360' },
      { name: 'twitter:description', content: 'Besoin d\'aide ? Consultez notre centre de support pour trouver des réponses à vos questions.' },
      { name: 'twitter:image', content: 'https://ndewa-360.com/assets/img/logo/logo-basic.png' }
    ]);
  }

   // Métadonnées pour la page de détail d'une propriété
  setupPropertyDetailPageMetaTags(propertyId: string): void {
    this.getPropertyDetails(propertyId).subscribe(property => {
      if (!property) {
        // Fallback si les détails de la propriété ne sont pas disponibles
        this.setupPropertyPageMetaTags();
        return;
      }

      // Construire l'URL complète
      const propertyUrl = `https://ndewa-360.com/search/property/${propertyId}`;
      
      // Utiliser l'image principale ou la première des médias
      const mainImage = property.image || (property.medias && property.medias.length > 0 ? property.medias[0] : 'https://ndewa-360.com/assets/img/logo/logo-basic.png');
      
      // Titre optimisé pour le SEO
      let title = `${property.name}`;
      
      // Ajouter la localisation au titre
      if (property.location) {
        title += ` à ${property.location}`;
        if (property.geolocationCity && property.geolocationCity.fullName) {
          title += `, ${property.geolocationCity.fullName}`;
        }
      }
      
      title += ` | Ndewa360`;
      
      // Description optimisée pour le SEO
      let description = `${property.name} situé(e) à ${property.location}`;
      
      if (property.geolocationCity && property.geolocationCity.fullName) {
        description += `, ${property.geolocationCity.fullName}`;
      }
      
      if (property.geolocationCountry && property.geolocationCountry.fullName) {
        description += `, ${property.geolocationCountry.fullName}`;
      }
      
      if (property.description) {
        description += `. ${property.description.substring(0, 150)}`;
      }
      
      if (property.roomLength) {
        description += `. ${property.roomLength} unité(s) locative(s) disponible(s).`;
      }
      
      const propertyFeatures = [];
      
      if (property.hasParking) {
        propertyFeatures.push('parking');
      }
      
      if (property.hasClosure) {
        propertyFeatures.push('clôture');
      }
      
      if (propertyFeatures.length > 0) {
        description += ` La propriété dispose de: ${propertyFeatures.join(', ')}.`;
      }
      
      // Mots-clés optimisés pour le SEO
      const keywords = [
        'propriété',
        property.name,
        property.location,
        property.geolocationCity?.fullName || '',
        property.geolocationCountry?.fullName || '',
        'logement',
        'immobilier',
        'Ndewa360'
      ].filter(Boolean).join(', ');

      this.titleService.setTitle(title);
      this.meta.addTags([
        { name: 'description', content: description },
        { name: 'keywords', content: keywords },
        { name: 'author', content: 'Ndewa360' },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: propertyUrl },
        { property: 'og:type', content: 'website' },
        { property: 'og:image', content: mainImage },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
        { name: 'twitter:image', content: mainImage }
      ]);
    });
  }
}


export interface CountryModel {
    _id: string;

    // Noms
    fullName: string;
    shortName: string;

    // Codes ISO
    iso2: string;
    iso3: string;

    // Informations géographiques
    continent: string;
    region?: string;
    subregion?: string;
    capital?: string;

    // Devise et économie
    currency: string;
    phoneCode?: string;

    // Coordonnées
    long: number;
    lat: number;

    // Informations supplémentaires
    languages?: string[];
    timezone?: string;
    flag?: string;
    population?: number;
    area?: number;

    // Relations
    cities: any[];

    // Statut
    isActive?: boolean;
    isDeleted?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
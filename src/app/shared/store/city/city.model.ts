
export interface CityModel {
    _id: string;

    // Nom
    fullName: string;

    // Relation avec le pays
    country: string | any; // Peut être un ID string ou un objet Country populé

    // Informations géographiques
    region?: string;
    population?: number;
    long: number;
    lat: number;
    elevation?: number;
    area?: number;

    // Informations administratives
    timezone?: string;
    isCapital?: boolean;
    postalCode?: string;

    // Statut
    isActive?: boolean;
    isDeleted?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
import { CityModel } from "../city";
import { CountryModel } from "../country";
import { ContractTemplateModel } from "../../models/contract-template.model";

export interface PropertyModel {

    name:string;
    location:string;
    geolocationCountry:CountryModel;
    geolocationCity:CityModel
    description?:string;
    image?:string;
    medias?:string[];
    createdAt?: Date,
    updatedAt?: Date,
    hasClosure?:boolean,
    code:string;
    _id:string;
    hasParking?:boolean;
    owner?:string;
    roomLength?:number;

    // Nouvelles propriétés pour une gestion immobilière complète
    propertyType?: 'APARTMENT' | 'HOUSE' | 'COMMERCIAL' | 'MIXED' | 'LAND';
    totalSurface?: number; // Surface totale en m²
    buildingYear?: number; // Année de construction
    floors?: number; // Nombre d'étages
    hasElevator?: boolean; // Ascenseur
    hasGarden?: boolean; // Jardin
    hasPool?: boolean; // Piscine
    hasGym?: boolean; // Salle de sport
    hasSecurity?: boolean; // Sécurité 24h/24
    hasGenerator?: boolean; // Générateur
    hasWater?: boolean; // Eau courante
    hasInternet?: boolean; // Internet
    condition?: 'NEW' | 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'; // État du bien
    furnishingStatus?: 'FURNISHED' | 'SEMI_FURNISHED' | 'UNFURNISHED'; // Meublé
    availabilityStatus?: 'AVAILABLE' | 'PARTIALLY_OCCUPIED' | 'FULLY_OCCUPIED' | 'MAINTENANCE'; // Statut de disponibilité
    monthlyCharges?: number; // Charges mensuelles
    propertyTax?: number; // Taxe foncière annuelle
    insuranceCost?: number; // Coût d'assurance annuel
    managementFees?: number; // Frais de gestion mensuels
    acquisitionPrice?: number; // Prix d'acquisition
    currentValue?: number; // Valeur actuelle estimée
    rentRange?: { min: number; max: number }; // Fourchette de loyers

    // Modèle de contrat personnalisé pour cette propriété
    contractTemplate?: ContractTemplateModel | string; // Peut être l'objet complet ou juste l'ID
}
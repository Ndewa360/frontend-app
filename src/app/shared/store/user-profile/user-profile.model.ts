
export interface UserProfileModel {

    _id?:string;

    name?:string;

    email?:string;

    phoneNumber?:string;

    photo?:string;

    profilePicture?:string; // Correspond au backend

    coverPicture?:string;

    country?:string;

    location?:string;

    uid?:string;

    bio?:string;

    emailConfirmed?:boolean;

    telConfirmed?:boolean;

    // Contacts supplémentaires
    whatsappContact?:string;

    skype?:string;

    websiteLink?:string;

    // Préférences de localisation
    preferredLanguage?: string; // Code ISO 639-1 (ex: 'fr', 'en', 'es')
    preferredCurrency?: string; // Code ISO 4217 (ex: 'EUR', 'USD', 'XAF')
    timezone?: string; // Timezone IANA (ex: 'Europe/Paris', 'Africa/Douala')
    dateFormat?: string; // Format de date préféré (ex: 'DD/MM/YYYY', 'MM/DD/YYYY')
    numberFormat?: string; // Format des nombres (ex: 'fr-FR', 'en-US')

    // Paramètres utilisateur (correspond au backend UserSetting)
    userSetting?: {
        language?: string;
        theme?: string;
        currency?: string;
        isEnglishTimeFormat?: boolean;
    };


    // Métadonnées
    createdAt?: Date;
    isDeleted?: boolean;
    isDisabled?: boolean;
}
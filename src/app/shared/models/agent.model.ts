export enum AgentStatus {
    PENDING = 'pending',
    CERTIFIED = 'certified',
    PROBATION = 'probation',
    SUSPENDED = 'suspended',
    TRUSTED = 'trusted'
}

export enum AgentVerificationType {
    CNI = 'cni',
    PASSPORT = 'passport',
    DRIVING_LICENSE = 'driving_license',
    PROFESSIONAL_CARD = 'professional_card'
}

export interface AgentProfile {
    _id: string;
    userId: string;
    status: AgentStatus;
    businessName: string;
    professionalPhone: string;
    professionalEmail?: string;
    businessAddress?: string;
    businessDescription?: string;
    verificationType: AgentVerificationType;
    verificationNumber: string;
    verificationDocumentUrl: string;
    professionalCardUrl?: string;
    businessLicenseUrl?: string;
    totalPropertiesManaged: number;
    totalPropertiesValidated: number;
    totalPropertiesRejected: number;
    validationScore: number;
    averageRating: number;
    totalRatings: number;
    specializations: string[];
    operatingZones: string[];
    commissionRate: string;
    isVerified: boolean;
    canAutoPublish: boolean;
    verifiedAt?: Date;
    verifiedBy?: string;
    rejectionReason?: string;
    suspendedUntil?: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface AgentStats {
    totalPropertiesManaged: number;
    totalPropertiesValidated: number;
    totalPropertiesRejected: number;
    validationRate: number;
    validationScore: number;
    averageRating: number;
    totalRatings: number;
    status: AgentStatus;
    canAutoPublish: boolean;
}

export interface PropertyOwnerInfo {
    _id?: string;
    fullName: string;
    phoneNumber: string;
    whatsappNumber?: string;
    email?: string;
    address?: string;
    cniNumber?: string;
    relationship?: string;
    hasGivenConsent: boolean;
    consentDate?: Date;
    consentMethod?: string;
    preferredContactMethod?: string;
    preferredContactTime?: string;
    notes?: string;
}
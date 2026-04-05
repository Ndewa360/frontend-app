import { SouscriptionPeriodModel } from '../souscription-period';

export enum SouscriptionPayementState {
  WAITING       = 'waiting',
  UNPAYED       = 'unpaid',
  PAYED         = 'payed',
  SHOULD_NOT_PAYED = 'should_not_payed'
}

export enum SouscriptionType {
  DEFAULT      = 'default',
  NOTIFICATION = 'notification'
}

export enum SouscriptionPlan {
  FREE    = 'free',
  PREMIUM = 'premium'
}

export enum AccountStatus {
  ACTIVE    = 'active',
  SUSPENDED = 'suspended',
  DISABLED  = 'disabled'
}

export interface SouscriptionModel {
  _id?: string;
  owner: string;
  isRunning: boolean;
  startedAt: Date;
  endedAt: Date;
  reminderId: string;
  unPayReminderId: string;
  periods: SouscriptionPeriodModel[];
  currentPeriod: string;
  souscriptionType: SouscriptionType;
  plan: SouscriptionPlan;
  accountStatus: AccountStatus;
  propertyLimit: number;
  unitsPerPropertyLimit: number;
  monthlyAmount: number;
  lastCalculationDate: Date;
  suspensionDate: Date;
  // Champs enrichis retournés par GET /souscription/current
  userType?: string;
  displayLimits?: {
    properties: number;
    unitsPerProperty: number;
  };
  createdAt?: Date;
}

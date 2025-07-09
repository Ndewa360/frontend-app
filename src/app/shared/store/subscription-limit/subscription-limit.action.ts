export namespace SubscriptionLimitAction {
  
  export class CheckCanCreateProperty {
    static readonly type = '[SubscriptionLimit] Check Can Create Property';
  }

  export class GetSubscriptionStatus {
    static readonly type = '[SubscriptionLimit] Get Subscription Status';
  }

  export class UpgradeToPremium {
    static readonly type = '[SubscriptionLimit] Upgrade To Premium';
  }

  export class ReactivateAccount {
    static readonly type = '[SubscriptionLimit] Reactivate Account';
  }

  export class CalculateMonthlyAmount {
    static readonly type = '[SubscriptionLimit] Calculate Monthly Amount';
  }

  export class ValidatePropertyCreation {
    static readonly type = '[SubscriptionLimit] Validate Property Creation';
  }

  export class UpdatePropertyCount {
    static readonly type = '[SubscriptionLimit] Update Property Count';
    constructor(public userId: string) {}
  }

  export class SetSubscriptionStatus {
    static readonly type = '[SubscriptionLimit] Set Subscription Status';
    constructor(public status: any) {}
  }

  export class SetCanCreateProperty {
    static readonly type = '[SubscriptionLimit] Set Can Create Property';
    constructor(public canCreate: boolean, public needsUpgrade: boolean) {}
  }

  export class SetMonthlyAmount {
    static readonly type = '[SubscriptionLimit] Set Monthly Amount';
    constructor(public amount: number, public month: string) {}
  }

  export class SetLoading {
    static readonly type = '[SubscriptionLimit] Set Loading';
    constructor(public loading: boolean) {}
  }

  export class SetError {
    static readonly type = '[SubscriptionLimit] Set Error';
    constructor(public error: string | null) {}
  }
}

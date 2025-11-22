import { SubscriptionFilters, SubscriptionAction, BulkSubscriptionAction } from './admin-subscriptions.model';

export namespace AdminSubscriptionsAction {
  
  // Load Actions
  export class LoadSubscriptions {
    static readonly type = '[Admin Subscriptions] Load Subscriptions';
    constructor(public filters?: SubscriptionFilters) {}
  }

  export class LoadStats {
    static readonly type = '[Admin Subscriptions] Load Stats';
  }

  export class LoadSubscriptionDetails {
    static readonly type = '[Admin Subscriptions] Load Subscription Details';
    constructor(public subscriptionId: string) {}
  }

  // Filter Actions
  export class SetFilters {
    static readonly type = '[Admin Subscriptions] Set Filters';
    constructor(public filters: SubscriptionFilters) {}
  }

  export class ClearFilters {
    static readonly type = '[Admin Subscriptions] Clear Filters';
  }

  // Subscription Management Actions
  export class ForceUpgradeToPremium {
    static readonly type = '[Admin Subscriptions] Force Upgrade To Premium';
    constructor(public subscriptionId: string, public reason?: string) {}
  }

  export class ChangePlan {
    static readonly type = '[Admin Subscriptions] Change Plan';
    constructor(public subscriptionId: string, public targetPlan: string, public reason?: string) {}
  }

  export class SuspendAccount {
    static readonly type = '[Admin Subscriptions] Suspend Account';
    constructor(public subscriptionId: string, public reason: string) {}
  }

  export class ReactivateAccount {
    static readonly type = '[Admin Subscriptions] Reactivate Account';
    constructor(public subscriptionId: string) {}
  }

  export class DisableAccount {
    static readonly type = '[Admin Subscriptions] Disable Account';
    constructor(public subscriptionId: string, public reason: string) {}
  }

  // Payment Actions
  export class SendPaymentReminder {
    static readonly type = '[Admin Subscriptions] Send Payment Reminder';
    constructor(public subscriptionId: string) {}
  }

  export class MarkPaymentAsPaid {
    static readonly type = '[Admin Subscriptions] Mark Payment As Paid';
    constructor(public subscriptionId: string, public periodId: string, public paymentReference: string) {}
  }

  export class ProcessUnpaidInvoices {
    static readonly type = '[Admin Subscriptions] Process Unpaid Invoices';
    constructor(public subscriptionId: string) {}
  }

  // Bulk Actions
  export class BulkAction {
    static readonly type = '[Admin Subscriptions] Bulk Action';
    constructor(public action: BulkSubscriptionAction) {}
  }

  export class BulkUpgrade {
    static readonly type = '[Admin Subscriptions] Bulk Upgrade';
    constructor(public subscriptionIds: string[], public targetPlan: string, public reason?: string) {}
  }

  export class BulkSuspend {
    static readonly type = '[Admin Subscriptions] Bulk Suspend';
    constructor(public subscriptionIds: string[], public reason: string) {}
  }

  export class BulkReactivate {
    static readonly type = '[Admin Subscriptions] Bulk Reactivate';
    constructor(public subscriptionIds: string[]) {}
  }

  // Selection Actions
  export class SelectSubscription {
    static readonly type = '[Admin Subscriptions] Select Subscription';
    constructor(public subscriptionId: string) {}
  }

  export class UnselectSubscription {
    static readonly type = '[Admin Subscriptions] Unselect Subscription';
    constructor(public subscriptionId: string) {}
  }

  export class SelectAllSubscriptions {
    static readonly type = '[Admin Subscriptions] Select All Subscriptions';
  }

  export class ClearSelection {
    static readonly type = '[Admin Subscriptions] Clear Selection';
  }

  // Export Actions
  export class ExportSubscriptions {
    static readonly type = '[Admin Subscriptions] Export Subscriptions';
    constructor(public filters?: SubscriptionFilters, public format: string = 'xlsx') {}
  }

  export class GenerateReport {
    static readonly type = '[Admin Subscriptions] Generate Report';
    constructor(public reportType: string, public dateFrom: Date, public dateTo: Date) {}
  }

  // Utility Actions
  export class RefreshData {
    static readonly type = '[Admin Subscriptions] Refresh Data';
  }

  export class SetLoading {
    static readonly type = '[Admin Subscriptions] Set Loading';
    constructor(public loading: boolean) {}
  }

  export class SetError {
    static readonly type = '[Admin Subscriptions] Set Error';
    constructor(public error: any) {}
  }

  export class ClearError {
    static readonly type = '[Admin Subscriptions] Clear Error';
  }

  // Success Actions
  export class LoadSubscriptionsSuccess {
    static readonly type = '[Admin Subscriptions] Load Subscriptions Success';
    constructor(public data: { subscriptions: any[], total: number, meta: any }) {}
  }

  export class LoadStatsSuccess {
    static readonly type = '[Admin Subscriptions] Load Stats Success';
    constructor(public stats: any) {}
  }

  export class SubscriptionActionSuccess {
    static readonly type = '[Admin Subscriptions] Subscription Action Success';
    constructor(public result: any) {}
  }

  // Error Actions
  export class LoadSubscriptionsError {
    static readonly type = '[Admin Subscriptions] Load Subscriptions Error';
    constructor(public error: any) {}
  }

  export class LoadStatsError {
    static readonly type = '[Admin Subscriptions] Load Stats Error';
    constructor(public error: any) {}
  }

  export class SubscriptionActionError {
    static readonly type = '[Admin Subscriptions] Subscription Action Error';
    constructor(public error: any) {}
  }
}
/**
 * Événements poussés par le backend (voir backend/src/realtime/realtime.events.ts).
 * Toute évolution du contrat doit être faite des deux côtés.
 */
export const RealtimeEvent = {
  PaymentStatus: 'payment.status',
  NotificationCreated: 'notification.created',
  NotificationsChanged: 'notifications.changed',
  WalletWithdrawalUpdated: 'wallet.withdrawal.updated',
  WalletUpdated: 'wallet.updated',
  SubscriptionUpdated: 'subscription.updated',
} as const;

export type RealtimeEventName = (typeof RealtimeEvent)[keyof typeof RealtimeEvent];

export interface RealtimePayloads {
  'payment.status': { externalRef: string; status: string; context?: string; amount?: number };
  'notification.created': { id: string; type: string; title: string; message: string; createdAt?: string };
  'notifications.changed': Record<string, never>;
  'wallet.withdrawal.updated': { withdrawalId: string; status: string };
  'wallet.updated': { balance: number };
  'subscription.updated': { periodId: string; state: string };
}

import { NotificationDetailModalComponent } from './notification-detail-modal.component';
import { SmartNotification } from '../../services/notification-manager.service';

describe('NotificationDetailModalComponent', () => {
  const notification: SmartNotification = {
    id: 'n1',
    source: 'server',
    type: 'server',
    priority: 'high',
    title: 'Facture impayée',
    message: 'Votre facture de novembre est impayée.',
    actionLabel: 'NOTIFICATION_DETAIL.ACTIONS.PAY_INVOICES',
    actionRoute: '/app/facturation/plan/facture',
    data: { amount: 10000, currency: 'XAF', reference: 'INV-123' },
    createdAt: new Date('2026-12-01T09:00:00Z'),
    isRead: false,
  };

  function setup(item: SmartNotification = notification) {
    const dialogRef = { close: jest.fn() };
    const manager = { markAsRead: jest.fn(), removeNotification: jest.fn() };
    const router = { navigateByUrl: jest.fn() };
    const lang = { getCurrentLanguage: () => 'fr' };
    const component = new NotificationDetailModalComponent(item, dialogRef as any, manager as any, router as any, lang as any);
    return { component, dialogRef, manager, router };
  }

  it('affiche le contexte et signale une notification urgente', () => {
    const { component } = setup();
    expect(component.hasDetails).toBe(true);
    expect(component.isUrgent).toBe(true);
    expect(component.isRead).toBe(false);
  });

  it('marque la notification comme lue sans fermer la fenêtre', () => {
    const { component, manager, dialogRef } = setup();
    component.markAsRead();
    expect(manager.markAsRead).toHaveBeenCalledWith('n1');
    expect(component.isRead).toBe(true);
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('ouvre la page liée dans la langue courante et marque comme lue', () => {
    const { component, manager, router, dialogRef } = setup();
    component.openLink();
    expect(manager.markAsRead).toHaveBeenCalledWith('n1');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/fr/app/facturation/plan/facture');
    expect(dialogRef.close).toHaveBeenCalledWith('opened');
  });

  it('supprime la notification et ferme la fenêtre', () => {
    const { component, manager, dialogRef } = setup();
    component.remove();
    expect(manager.removeNotification).toHaveBeenCalledWith('n1');
    expect(dialogRef.close).toHaveBeenCalledWith('removed');
  });

  it("n'affiche pas de bloc de détails vide", () => {
    const { component } = setup({ ...notification, data: { amount: 0 } });
    expect(component.hasDetails).toBe(false);
  });
});

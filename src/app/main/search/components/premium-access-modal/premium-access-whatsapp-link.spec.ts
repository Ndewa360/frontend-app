import { PremiumAccessModalComponent } from './premium-access-modal.component';

/** Lien « Contacter sur WhatsApp » de l'accès premium. */
describe('PremiumAccessModalComponent — lien WhatsApp', () => {
  function withOwner(owner: { whatsapp?: string; phone?: string }) {
    const component = Object.create(PremiumAccessModalComponent.prototype) as PremiumAccessModalComponent;
    (component as any).ownerInfo = { owner };
    (component as any).translate = { instant: () => 'Bonjour' };
    return component;
  }

  it('utilise le numéro WhatsApp, en chiffres seuls', () => {
    expect(withOwner({ whatsapp: '+237 677 11 22 33', phone: '+237698295368' }).getWhatsAppLink())
      .toBe('https://wa.me/237677112233?text=Bonjour');
  });

  it('se rabat sur le téléphone quand le numéro WhatsApp est vide', () => {
    const component = withOwner({ whatsapp: '', phone: '+237 698 29 53 68' });
    expect(component.ownerWhatsapp).toBe('+237 698 29 53 68');
    expect(component.getWhatsAppLink()).toBe('https://wa.me/237698295368?text=Bonjour');
  });

  it('ne produit pas de lien sans aucun numéro', () => {
    expect(withOwner({}).getWhatsAppLink()).toBe('#');
  });
});

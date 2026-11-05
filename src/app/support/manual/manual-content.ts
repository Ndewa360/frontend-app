/**
 * Documentation Ndewa360 (Support › Documentation), en français et en anglais.
 *
 * Contenu rédigé à partir du fonctionnement réel de l'application (grille
 * « Loyers sous contrôle », règles du portefeuille, suspension pour impayé).
 * Chaque article a un identifiant stable, utilisé dans l'adresse
 * (?article=…) pour pouvoir partager un lien direct.
 */

export type ManualLang = 'fr' | 'en';

export type ManualBlock =
  | { type: 'p'; text: string }
  | { type: 'steps'; items: string[] }
  | { type: 'list'; items: string[] }
  | { type: 'note'; text: string };

export interface ManualLink {
  label: string;
  /** Chemin après la langue, ex. ['app', 'portefeuille']. */
  path: string[];
}

export interface ManualArticle {
  id: string;
  title: string;
  summary: string;
  blocks: ManualBlock[];
  links?: ManualLink[];
}

export interface ManualSection {
  id: string;
  title: string;
  icon: string;
  articles: ManualArticle[];
}

export interface ManualUi {
  title: string;
  subtitle: string;
  menu: string;
  closeMenu: string;
  openPage: string;
  previous: string;
  next: string;
  stillStuck: string;
  contactSupport: string;
  faq: string;
  steps: string;
  good: string;
}

const FR: { ui: ManualUi; sections: ManualSection[] } = {
  ui: {
    title: 'Documentation',
    subtitle: 'Guides pas à pas pour gérer vos biens, vos locataires et vos loyers avec Ndewa360.',
    menu: 'Sommaire',
    closeMenu: 'Fermer le sommaire',
    openPage: 'Ouvrir la page',
    previous: 'Article précédent',
    next: 'Article suivant',
    stillStuck: 'Vous ne trouvez pas la réponse ?',
    contactSupport: 'Contacter le support',
    faq: 'Questions fréquentes',
    steps: 'Étapes',
    good: 'À savoir',
  },
  sections: [
    {
      id: 'start', title: 'Premiers pas', icon: 'fa-flag-checkered',
      articles: [
        {
          id: 'account',
          title: 'Créer et sécuriser votre compte',
          summary: 'Inscription, confirmation de l’adresse e-mail et mot de passe.',
          blocks: [
            { type: 'p', text: 'Votre compte Ndewa360 regroupe vos biens, vos locataires, vos paiements et votre portefeuille. Il est personnel : chaque gestionnaire que vous invitez dispose de son propre accès.' },
            { type: 'steps', items: [
              'Depuis la page d’accueil, choisissez « Commencer gratuitement » puis votre profil (propriétaire ou agent).',
              'Renseignez votre nom, votre adresse e-mail, votre numéro de téléphone et un mot de passe.',
              'Ouvrez l’e-mail de confirmation reçu et cliquez sur le lien : tant que l’adresse n’est pas confirmée, un bandeau le rappelle en haut de l’application.',
              'En cas d’oubli du mot de passe, utilisez « Mot de passe oublié » sur la page de connexion : un lien de réinitialisation vous est envoyé par e-mail.',
            ] },
            { type: 'note', text: 'Chaque nouveau compte bénéficie de 30 jours d’essai gratuit, sans carte bancaire.' },
          ],
          links: [{ label: 'Mon profil', path: ['app', 'profile'] }],
        },
        {
          id: 'navigation',
          title: 'Se repérer dans l’application',
          summary: 'Le menu principal et les écrans essentiels.',
          blocks: [
            { type: 'p', text: 'Le menu latéral donne accès aux espaces principaux :' },
            { type: 'list', items: [
              '« Bien immobilier » : vos biens, leurs logements, locataires, baux, paiements et tableaux financiers.',
              '« Facturation » : votre abonnement, la facture du mois et l’historique des factures.',
              '« Modèle de contrat » : les modèles utilisés pour générer les contrats de location.',
              'Le portefeuille, accessible depuis l’en-tête : solde, dépôts et retraits.',
              '« Aide » : cette documentation, les questions fréquentes et le formulaire de contact.',
            ] },
            { type: 'p', text: 'La recherche globale permet de retrouver rapidement un bien, un logement ou un locataire.' },
          ],
          links: [{ label: 'Mes biens', path: ['app', 'properties', 'home'] }],
        },
      ],
    },
    {
      id: 'properties', title: 'Biens et logements', icon: 'fa-building',
      articles: [
        {
          id: 'add-property',
          title: 'Ajouter un bien',
          summary: 'Créer un immeuble, une maison ou une cité et le localiser.',
          blocks: [
            { type: 'steps', items: [
              'Ouvrez le menu « Bien immobilier ».',
              'Cliquez sur « Nouveau + ».',
              'Renseignez le nom du bien, son type, la ville, le quartier et l’adresse, puis les équipements (parking, cuisine, etc.).',
              'Enregistrez : le bien apparaît dans votre liste et sa fiche s’ouvre.',
            ] },
            { type: 'note', text: 'Avec l’offre gratuite, vous pouvez gérer 1 bien. À partir du 2e bien, le forfait Pro s’applique (voir « Abonnement et facturation »).' },
          ],
          links: [{ label: 'Mes biens', path: ['app', 'properties', 'home'] }],
        },
        {
          id: 'add-unit',
          title: 'Ajouter des logements',
          summary: 'Chambres, studios et appartements d’un bien, avec leur loyer.',
          blocks: [
            { type: 'p', text: 'Un logement (ou unité) est ce que vous louez : une chambre, un studio, un appartement simple ou meublé.' },
            { type: 'steps', items: [
              'Ouvrez la fiche du bien depuis « Bien immobilier ».',
              'Dans l’onglet des logements, cliquez sur « Ajouter ».',
              'Indiquez le code du logement (ex. A2), son type, le loyer mensuel, la caution et ses équipements.',
              'Enregistrez. Le logement est libre tant qu’aucun locataire n’y est assigné.',
            ] },
            { type: 'note', text: 'Seuls les logements occupés comptent pour la facturation : un logement vide ne vous coûte rien.' },
          ],
        },
        {
          id: 'media',
          title: 'Photos et visites 360°',
          summary: 'Mettre en valeur un bien ou un logement libre.',
          blocks: [
            { type: 'steps', items: [
              'Ouvrez la fiche du bien ou du logement, puis « Galerie média ».',
              'Ajoutez vos photos (une barre de progression indique l’envoi de chaque fichier).',
              'En cas d’échec, un message l’indique et le fichier peut être renvoyé immédiatement.',
            ] },
            { type: 'p', text: 'Les logements libres et publiés apparaissent dans la recherche publique, avec leurs photos et leur visite 360° lorsqu’elle existe.' },
          ],
          links: [{ label: 'Voir la recherche publique', path: ['search', 'index'] }],
        },
      ],
    },
    {
      id: 'tenants', title: 'Locataires et baux', icon: 'fa-users',
      articles: [
        {
          id: 'add-tenant',
          title: 'Ajouter un locataire',
          summary: 'Enregistrer les coordonnées d’un locataire dans un bien.',
          blocks: [
            { type: 'steps', items: [
              'Ouvrez la fiche du bien, onglet des locataires.',
              'Cliquez sur « Ajouter un locataire ».',
              'Renseignez son nom, son téléphone (et WhatsApp si différent), son adresse e-mail et sa pièce d’identité.',
              'Enregistrez, puis assignez-lui un logement (article suivant).',
            ] },
          ],
        },
        {
          id: 'assign',
          title: 'Assigner un logement (bail)',
          summary: 'Lier un locataire à un logement, avec la date d’entrée et la caution.',
          blocks: [
            { type: 'steps', items: [
              'Depuis le logement libre, choisissez « Assigner un locataire ».',
              'Sélectionnez le locataire, la date d’entrée et la périodicité du loyer.',
              'Indiquez si la caution a déjà été versée : si oui, elle est enregistrée ; sinon, aucune écriture n’est créée.',
              'Validez : le logement passe à « occupé » et le suivi des loyers démarre à la date d’entrée.',
            ] },
            { type: 'note', text: 'Pour la facturation, un logement est compté comme occupé s’il l’a été au moins 15 jours dans le mois.' },
          ],
        },
        {
          id: 'contracts',
          title: 'Contrats de location et modèles',
          summary: 'Générer le contrat d’un bail à partir de vos modèles.',
          blocks: [
            { type: 'list', items: [
              'Le menu « Modèle de contrat » permet de créer, dupliquer et modifier vos modèles.',
              'Depuis un bail, générez le contrat au format PDF : il reprend les informations du bien, du logement et du locataire.',
              'Pour mettre fin à un bail, utilisez « Résilier » : le logement redevient libre.',
            ] },
          ],
          links: [{ label: 'Mes modèles de contrat', path: ['app', 'contract-templates'] }],
        },
      ],
    },
    {
      id: 'payments', title: 'Loyers et paiements', icon: 'fa-money-bill-wave',
      articles: [
        {
          id: 'record-payment',
          title: 'Enregistrer un paiement de loyer',
          summary: 'Saisir un loyer reçu en espèces, par virement ou Mobile Money.',
          blocks: [
            { type: 'steps', items: [
              'Ouvrez le logement ou le locataire concerné.',
              'Cliquez sur « Enregistrer un paiement ».',
              'Indiquez le montant, la date et le moyen de paiement.',
              'Validez : le solde du locataire (à jour, en retard ou en avance) est recalculé et un reçu est créé.',
            ] },
            { type: 'note', text: 'En saisie manuelle, aucun argent ne transite par Ndewa360 : vous gardez simplement une trace fiable.' },
          ],
        },
        {
          id: 'payment-link',
          title: 'Lien de paiement pour le locataire',
          summary: 'Permettre au locataire de payer lui-même par Mobile Money.',
          blocks: [
            { type: 'p', text: 'Chaque bail actif dispose d’un lien de paiement à transmettre au locataire (par WhatsApp ou SMS). Il reste valable tant que le contrat est en cours et sert pour tous ses paiements : loyer, caution, etc.' },
            { type: 'list', items: [
              'Le paiement est crédité sur votre portefeuille Ndewa360.',
              'Vous recevez une notification à chaque paiement.',
              'Le reçu est généré automatiquement.',
            ] },
          ],
          links: [{ label: 'Mon portefeuille', path: ['app', 'portefeuille'] }],
        },
        {
          id: 'receipts',
          title: 'Reçus de paiement',
          summary: 'Télécharger ou partager le reçu d’un loyer.',
          blocks: [
            { type: 'p', text: 'Un reçu PDF est produit pour chaque paiement enregistré. Retrouvez-le dans l’historique des paiements du locataire ou du logement, puis téléchargez-le ou partagez-le.' },
            { type: 'note', text: 'Si un reçu ne s’affiche pas tout de suite, l’application réessaie automatiquement ; un message clair s’affiche en cas d’échec.' },
          ],
        },
        {
          id: 'monthly-reports',
          title: 'Rapports mensuels',
          summary: 'Le récapitulatif de vos encaissements, mois par mois.',
          blocks: [
            { type: 'p', text: 'Chaque mois, un rapport récapitule les loyers attendus, encaissés et en retard pour l’ensemble de vos biens. Les rapports sont disponibles depuis votre profil, au format PDF.' },
          ],
          links: [{ label: 'Mes rapports mensuels', path: ['app', 'profile', 'rapports-mensuels'] }],
        },
      ],
    },
    {
      id: 'wallet', title: 'Portefeuille', icon: 'fa-wallet',
      articles: [
        {
          id: 'deposit',
          title: 'Alimenter le portefeuille',
          summary: 'Déposer de l’argent par Mobile Money.',
          blocks: [
            { type: 'steps', items: [
              'Ouvrez le portefeuille depuis l’en-tête.',
              'Cliquez sur « Déposer », saisissez le montant (500 FCFA minimum) et votre numéro Mobile Money.',
              'Confirmez le paiement sur votre téléphone.',
            ] },
            { type: 'p', text: 'Le solde sert notamment à régler automatiquement vos factures d’abonnement : lors des rappels, la facture est prélevée si le solde est suffisant.' },
          ],
          links: [{ label: 'Mon portefeuille', path: ['app', 'portefeuille'] }],
        },
        {
          id: 'withdraw',
          title: 'Retirer de l’argent',
          summary: 'Transférer votre solde vers un compte Mobile Money.',
          blocks: [
            { type: 'steps', items: [
              'Dans le portefeuille, cliquez sur « Retirer ».',
              'Saisissez le montant (500 FCFA minimum) et le numéro de réception.',
              'Vérifiez les frais Mobile Money et le montant net affichés, puis confirmez.',
            ] },
            { type: 'list', items: [
              'Un seul retrait peut être en cours à la fois : le suivant est possible dès que le premier est terminé.',
              'Le plafond par retrait est indiqué dans la fenêtre de retrait.',
              'Le statut se met à jour automatiquement ; vous êtes notifié à la fin du traitement.',
            ] },
          ],
          links: [{ label: 'Mon portefeuille', path: ['app', 'portefeuille'] }],
        },
      ],
    },
    {
      id: 'billing', title: 'Abonnement et facturation', icon: 'fa-file-invoice',
      articles: [
        {
          id: 'pricing',
          title: 'L’offre « Loyers sous contrôle »',
          summary: 'Ce qui est gratuit, ce qui est payant, et combien.',
          blocks: [
            { type: 'p', text: 'Ndewa360 est gratuit pour 1 bien et jusqu’à 4 logements occupés. Dès le 2e bien ou le 5e logement occupé, le forfait Pro s’applique, à prix fixe selon le total mensuel de vos loyers :' },
            { type: 'list', items: [
              'jusqu’à 250 000 FCFA de loyers : 3 000 FCFA / mois ;',
              'jusqu’à 500 000 FCFA : 6 000 FCFA / mois ;',
              'jusqu’à 1 000 000 FCFA : 10 000 FCFA / mois ;',
              'jusqu’à 2 500 000 FCFA : 20 000 FCFA / mois ;',
              'au-delà : forfait Gold, sur mesure.',
            ] },
            { type: 'note', text: 'Seuls les logements occupés au moins 15 jours dans le mois sont comptés. Le palier est recalculé automatiquement : aucune démarche n’est nécessaire.' },
          ],
          links: [{ label: 'Ma facturation', path: ['app', 'facturation', 'plan', 'dashboard'] }],
        },
        {
          id: 'invoices',
          title: 'Factures et paiement',
          summary: 'Comprendre la facture du mois et la régler.',
          blocks: [
            { type: 'list', items: [
              '« Total de la période » : le montant de la facture du mois.',
              '« Reste dû » : ce qu’il reste à payer sur cette facture (0 si elle est réglée).',
              'La facture du mois est à régler avant la fin du mois facturé ; passé ce délai, elle devient une facture échue impayée.',
            ] },
            { type: 'steps', items: [
              'Ouvrez « Facturation » puis « Factures ».',
              'Cliquez sur « Régler la facture » et payez par Mobile Money, ou alimentez votre portefeuille pour un prélèvement automatique.',
              'Une fois payée, la facture est téléchargeable en PDF.',
            ] },
          ],
          links: [{ label: 'Mes factures', path: ['app', 'facturation', 'plan', 'facture'] }],
        },
        {
          id: 'suspension',
          title: 'Compte suspendu pour impayé',
          summary: 'Ce qui reste possible et comment réactiver le compte.',
          blocks: [
            { type: 'p', text: 'Lorsqu’une facture échue reste impayée, le compte passe en lecture seule : vous pouvez consulter vos biens et télécharger vos documents, mais plus ajouter, modifier ni supprimer.' },
            { type: 'steps', items: [
              'Cliquez sur « Régler mes factures » dans le bandeau en haut de l’écran.',
              'Payez chaque facture échue (ou alimentez le portefeuille).',
              'Le compte est réactivé automatiquement dès que toutes les factures échues sont réglées.',
            ] },
          ],
          links: [{ label: 'Régler mes factures', path: ['app', 'facturation', 'plan', 'plan-list'] }],
        },
      ],
    },
    {
      id: 'team', title: 'Gestionnaires et agents', icon: 'fa-user-tie',
      articles: [
        {
          id: 'managers',
          title: 'Inviter un gestionnaire',
          summary: 'Confier la gestion d’un bien à un proche, un gardien ou un collaborateur.',
          blocks: [
            { type: 'steps', items: [
              'Ouvrez la fiche du bien, section des gestionnaires.',
              'Invitez la personne par son adresse e-mail et choisissez ses autorisations (consulter, encaisser, modifier…).',
              'Elle reçoit un lien par e-mail pour accéder à son espace.',
              'Vous pouvez modifier ses autorisations ou révoquer son accès à tout moment.',
            ] },
            { type: 'note', text: 'Vous savez ainsi exactement ce que votre gardien ou votre proche encaisse pour vous, mois par mois.' },
          ],
          links: [{ label: 'Mes biens', path: ['app', 'properties', 'home'] }],
        },
        {
          id: 'agent',
          title: 'Profil agent immobilier',
          summary: 'Créer un profil d’agence vérifié.',
          blocks: [
            { type: 'steps', items: [
              'Lors de l’inscription, choisissez le profil « Agent ».',
              'Renseignez votre agence : nom, adresse, description et logo.',
              'Transmettez vos justificatifs (CNI ou passeport, et carte professionnelle ou licence).',
              'Notre équipe valide votre dossier sous 24 à 48 h ouvrables ; en attendant, le compte est en mode limité.',
            ] },
          ],
          links: [{ label: 'Compléter mon profil agent', path: ['app', 'agent', 'complete-profile'] }],
        },
      ],
    },
  ],
};

const EN: { ui: ManualUi; sections: ManualSection[] } = {
  ui: {
    title: 'Documentation',
    subtitle: 'Step-by-step guides to manage your properties, tenants and rent with Ndewa360.',
    menu: 'Contents',
    closeMenu: 'Close contents',
    openPage: 'Open the page',
    previous: 'Previous article',
    next: 'Next article',
    stillStuck: 'Can’t find the answer?',
    contactSupport: 'Contact support',
    faq: 'FAQ',
    steps: 'Steps',
    good: 'Good to know',
  },
  sections: [
    {
      id: 'start', title: 'Getting started', icon: 'fa-flag-checkered',
      articles: [
        {
          id: 'account',
          title: 'Create and secure your account',
          summary: 'Sign-up, email confirmation and password.',
          blocks: [
            { type: 'p', text: 'Your Ndewa360 account holds your properties, tenants, payments and wallet. It is personal: every manager you invite gets their own access.' },
            { type: 'steps', items: [
              'From the home page, choose “Start for free”, then your profile (owner or agent).',
              'Enter your name, email address, phone number and a password.',
              'Open the confirmation email and click the link: until your address is confirmed, a banner reminds you at the top of the app.',
              'If you forget your password, use “Forgot password” on the sign-in page: a reset link is sent by email.',
            ] },
            { type: 'note', text: 'Every new account gets a 30-day free trial, no credit card required.' },
          ],
          links: [{ label: 'My profile', path: ['app', 'profile'] }],
        },
        {
          id: 'navigation',
          title: 'Finding your way around',
          summary: 'The main menu and key screens.',
          blocks: [
            { type: 'p', text: 'The side menu gives access to the main areas:' },
            { type: 'list', items: [
              '“Property”: your properties, their units, tenants, leases, payments and financial dashboards.',
              '“Billing”: your subscription, this month’s invoice and invoice history.',
              '“Contract template”: the templates used to generate lease contracts.',
              'The wallet, from the header: balance, deposits and withdrawals.',
              '“Help”: this documentation, the FAQ and the contact form.',
            ] },
            { type: 'p', text: 'Global search quickly finds a property, a unit or a tenant.' },
          ],
          links: [{ label: 'My properties', path: ['app', 'properties', 'home'] }],
        },
      ],
    },
    {
      id: 'properties', title: 'Properties and units', icon: 'fa-building',
      articles: [
        {
          id: 'add-property',
          title: 'Add a property',
          summary: 'Create a building, house or residence and locate it.',
          blocks: [
            { type: 'steps', items: [
              'Open the “Property” menu.',
              'Click “New +”.',
              'Enter the property name, type, city, district and address, then its amenities (parking, kitchen, etc.).',
              'Save: the property appears in your list and its page opens.',
            ] },
            { type: 'note', text: 'The free plan covers 1 property. From the 2nd property, the Pro plan applies (see “Subscription and billing”).' },
          ],
          links: [{ label: 'My properties', path: ['app', 'properties', 'home'] }],
        },
        {
          id: 'add-unit',
          title: 'Add units',
          summary: 'Rooms, studios and apartments of a property, with their rent.',
          blocks: [
            { type: 'p', text: 'A unit is what you rent out: a room, a studio, or a simple or furnished apartment.' },
            { type: 'steps', items: [
              'Open the property page from “Property”.',
              'In the units tab, click “Add”.',
              'Enter the unit code (e.g. A2), its type, monthly rent, deposit and amenities.',
              'Save. The unit stays vacant until a tenant is assigned to it.',
            ] },
            { type: 'note', text: 'Only occupied units count towards billing: a vacant unit costs you nothing.' },
          ],
        },
        {
          id: 'media',
          title: 'Photos and 360° tours',
          summary: 'Showcase a vacant property or unit.',
          blocks: [
            { type: 'steps', items: [
              'Open the property or unit page, then “Media gallery”.',
              'Add your photos (a progress bar shows each file being uploaded).',
              'If an upload fails, a message says so and the file can be sent again right away.',
            ] },
            { type: 'p', text: 'Vacant, published units appear in the public search, with their photos and their 360° tour when available.' },
          ],
          links: [{ label: 'See the public search', path: ['search', 'index'] }],
        },
      ],
    },
    {
      id: 'tenants', title: 'Tenants and leases', icon: 'fa-users',
      articles: [
        {
          id: 'add-tenant',
          title: 'Add a tenant',
          summary: 'Record a tenant’s details in a property.',
          blocks: [
            { type: 'steps', items: [
              'Open the property page, tenants tab.',
              'Click “Add a tenant”.',
              'Enter their name, phone (and WhatsApp if different), email address and ID document.',
              'Save, then assign them a unit (next article).',
            ] },
          ],
        },
        {
          id: 'assign',
          title: 'Assign a unit (lease)',
          summary: 'Link a tenant to a unit, with the move-in date and deposit.',
          blocks: [
            { type: 'steps', items: [
              'From the vacant unit, choose “Assign a tenant”.',
              'Select the tenant, the move-in date and the rent frequency.',
              'Say whether the deposit has already been paid: if so, it is recorded; otherwise no entry is created.',
              'Confirm: the unit becomes “occupied” and rent tracking starts on the move-in date.',
            ] },
            { type: 'note', text: 'For billing, a unit counts as occupied if it was occupied for at least 15 days in the month.' },
          ],
        },
        {
          id: 'contracts',
          title: 'Lease contracts and templates',
          summary: 'Generate a lease contract from your templates.',
          blocks: [
            { type: 'list', items: [
              'The “Contract template” menu lets you create, duplicate and edit your templates.',
              'From a lease, generate the PDF contract: it includes the property, unit and tenant details.',
              'To end a lease, use “Terminate”: the unit becomes vacant again.',
            ] },
          ],
          links: [{ label: 'My contract templates', path: ['app', 'contract-templates'] }],
        },
      ],
    },
    {
      id: 'payments', title: 'Rent and payments', icon: 'fa-money-bill-wave',
      articles: [
        {
          id: 'record-payment',
          title: 'Record a rent payment',
          summary: 'Enter rent received in cash, by transfer or Mobile Money.',
          blocks: [
            { type: 'steps', items: [
              'Open the relevant unit or tenant.',
              'Click “Record a payment”.',
              'Enter the amount, date and payment method.',
              'Confirm: the tenant’s balance (up to date, late or in advance) is recalculated and a receipt is created.',
            ] },
            { type: 'note', text: 'With manual entry, no money goes through Ndewa360: you simply keep a reliable record.' },
          ],
        },
        {
          id: 'payment-link',
          title: 'Payment link for the tenant',
          summary: 'Let the tenant pay by Mobile Money themselves.',
          blocks: [
            { type: 'p', text: 'Each active lease has a payment link to send to the tenant (by WhatsApp or SMS). It stays valid while the lease is active and works for all their payments: rent, deposit, etc.' },
            { type: 'list', items: [
              'The payment is credited to your Ndewa360 wallet.',
              'You are notified of every payment.',
              'The receipt is generated automatically.',
            ] },
          ],
          links: [{ label: 'My wallet', path: ['app', 'portefeuille'] }],
        },
        {
          id: 'receipts',
          title: 'Payment receipts',
          summary: 'Download or share a rent receipt.',
          blocks: [
            { type: 'p', text: 'A PDF receipt is produced for every recorded payment. Find it in the tenant’s or unit’s payment history, then download or share it.' },
            { type: 'note', text: 'If a receipt does not appear straight away, the app retries automatically; a clear message is shown if it fails.' },
          ],
        },
        {
          id: 'monthly-reports',
          title: 'Monthly reports',
          summary: 'A month-by-month summary of your collections.',
          blocks: [
            { type: 'p', text: 'Every month, a report summarises expected, collected and overdue rent across all your properties. Reports are available as PDF from your profile.' },
          ],
          links: [{ label: 'My monthly reports', path: ['app', 'profile', 'rapports-mensuels'] }],
        },
      ],
    },
    {
      id: 'wallet', title: 'Wallet', icon: 'fa-wallet',
      articles: [
        {
          id: 'deposit',
          title: 'Top up the wallet',
          summary: 'Deposit money by Mobile Money.',
          blocks: [
            { type: 'steps', items: [
              'Open the wallet from the header.',
              'Click “Deposit”, enter the amount (at least 500 FCFA) and your Mobile Money number.',
              'Confirm the payment on your phone.',
            ] },
            { type: 'p', text: 'The balance can pay your subscription invoices automatically: on reminder days, the invoice is debited if the balance is sufficient.' },
          ],
          links: [{ label: 'My wallet', path: ['app', 'portefeuille'] }],
        },
        {
          id: 'withdraw',
          title: 'Withdraw money',
          summary: 'Transfer your balance to a Mobile Money account.',
          blocks: [
            { type: 'steps', items: [
              'In the wallet, click “Withdraw”.',
              'Enter the amount (at least 500 FCFA) and the receiving number.',
              'Check the Mobile Money fees and the net amount shown, then confirm.',
            ] },
            { type: 'list', items: [
              'Only one withdrawal can be in progress at a time: the next one is possible once the first is complete.',
              'The maximum per withdrawal is shown in the withdrawal window.',
              'The status updates automatically; you are notified when processing ends.',
            ] },
          ],
          links: [{ label: 'My wallet', path: ['app', 'portefeuille'] }],
        },
      ],
    },
    {
      id: 'billing', title: 'Subscription and billing', icon: 'fa-file-invoice',
      articles: [
        {
          id: 'pricing',
          title: 'The “Rent under control” offer',
          summary: 'What is free, what is paid, and how much.',
          blocks: [
            { type: 'p', text: 'Ndewa360 is free for 1 property and up to 4 occupied units. From the 2nd property or the 5th occupied unit, the Pro plan applies, at a fixed price based on your total monthly rent:' },
            { type: 'list', items: [
              'up to 250,000 FCFA of rent: 3,000 FCFA / month;',
              'up to 500,000 FCFA: 6,000 FCFA / month;',
              'up to 1,000,000 FCFA: 10,000 FCFA / month;',
              'up to 2,500,000 FCFA: 20,000 FCFA / month;',
              'beyond that: Gold plan, tailored.',
            ] },
            { type: 'note', text: 'Only units occupied for at least 15 days in the month are counted. Your tier is recalculated automatically: nothing to do.' },
          ],
          links: [{ label: 'My billing', path: ['app', 'facturation', 'plan', 'dashboard'] }],
        },
        {
          id: 'invoices',
          title: 'Invoices and payment',
          summary: 'Understand and pay this month’s invoice.',
          blocks: [
            { type: 'list', items: [
              '“Period total”: the amount of this month’s invoice.',
              '“Amount due”: what remains to be paid on that invoice (0 once paid).',
              'This month’s invoice is due by the end of the billed month; after that it becomes an overdue unpaid invoice.',
            ] },
            { type: 'steps', items: [
              'Open “Billing”, then “Invoices”.',
              'Click “Pay the invoice” and pay by Mobile Money, or top up your wallet for an automatic debit.',
              'Once paid, the invoice can be downloaded as PDF.',
            ] },
          ],
          links: [{ label: 'My invoices', path: ['app', 'facturation', 'plan', 'facture'] }],
        },
        {
          id: 'suspension',
          title: 'Account suspended for non-payment',
          summary: 'What you can still do and how to reactivate the account.',
          blocks: [
            { type: 'p', text: 'When an overdue invoice remains unpaid, the account becomes read-only: you can view your properties and download your documents, but not add, edit or delete.' },
            { type: 'steps', items: [
              'Click “Pay my invoices” in the banner at the top of the screen.',
              'Pay each overdue invoice (or top up the wallet).',
              'The account is reactivated automatically as soon as every overdue invoice is paid.',
            ] },
          ],
          links: [{ label: 'Pay my invoices', path: ['app', 'facturation', 'plan', 'plan-list'] }],
        },
      ],
    },
    {
      id: 'team', title: 'Managers and agents', icon: 'fa-user-tie',
      articles: [
        {
          id: 'managers',
          title: 'Invite a manager',
          summary: 'Hand over a property to a relative, caretaker or colleague.',
          blocks: [
            { type: 'steps', items: [
              'Open the property page, managers section.',
              'Invite the person by email and choose their permissions (view, collect, edit…).',
              'They receive a link by email to access their space.',
              'You can change their permissions or revoke their access at any time.',
            ] },
            { type: 'note', text: 'You know exactly what your caretaker or relative collects for you, month by month.' },
          ],
          links: [{ label: 'My properties', path: ['app', 'properties', 'home'] }],
        },
        {
          id: 'agent',
          title: 'Real estate agent profile',
          summary: 'Create a verified agency profile.',
          blocks: [
            { type: 'steps', items: [
              'When signing up, choose the “Agent” profile.',
              'Enter your agency details: name, address, description and logo.',
              'Upload your documents (ID card or passport, and professional card or licence).',
              'Our team reviews your file within 24 to 48 business hours; meanwhile the account is in limited mode.',
            ] },
          ],
          links: [{ label: 'Complete my agent profile', path: ['app', 'agent', 'complete-profile'] }],
        },
      ],
    },
  ],
};

export const MANUAL = { fr: FR, en: EN } as const;

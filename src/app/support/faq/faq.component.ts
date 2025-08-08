import {Component, OnInit} from '@angular/core'
import { Select } from '@ngxs/store'
import { Observable } from 'rxjs'
import { UserProfileState, UserProfileModel } from 'src/app/shared/store'
import { Location } from '@angular/common';

@Component({
  selector: 'app-faq',
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.scss']
})
export class FaqComponent implements OnInit {

  @Select(UserProfileState.selectStateUserProfile) userProfil$:Observable<UserProfileModel>
  
  public faq = [
    {
      groupName: 'Général',
      children: [
        {
          title: 'Qu’est-ce que Ndewa360 ?',
          content: 'Ndewa360 est une plateforme de gestion et de location de biens immobiliers, spécialement conçue pour faciliter les recherches de logements étudiants avec une expérience de visite en 360°. Elle permet aussi aux propriétaires de gérer les loyers, les locataires et les finances.',
        },
        {
          title: 'Est-ce que l’utilisation de Ndewa360 est gratuite ?',
          content: ' L’inscription est gratuite. Toutes les fonctionnalités sont gratuite en dessous de un bien avec au plus 10 unités locative. A la onzieme unité, il faut payer 2% du loyer de chaque unité locative activé par mois.',
        },
        {
          title: 'Où puis-je trouver les vidéos de formation ?',
          content: 'Toutes les vidéos sont disponibles sur notre chaîne YouTube officielle : https://www.youtube.com/channel/UCUoWr4IOAJnjOq-kvb-yueA.',
        },
      ]
    },
    {
      groupName: 'Pour les propriétaires',
      children: [
        {
          title: 'Comment m’inscrire en tant que propriétaire ?',
          content: ' Vous pouvez vous inscrire en quelques clics via la page d\'accueil. Une fois inscrit, vous recevrez un email de confirmation. <br/><br/> Voir la vidéo : "Comment s\'inscrire sur Ndewa360 ?" ➜ <a href="https://www.youtube.com/watch?v=gyin31wzg4Q">https://www.youtube.com/watch?v=gyin31wzg4Q</a>',
        },
        {
          title: ' Comment créer une propriété ?',
          content: 'Allez dans le menu « Bien immobilier » et cliquez sur « Nouveau + ». Renseignez les informations demandées. <br/><br/> Voir la vidéo : "Ajouter un bien immobilier sur Ndewa360 – Guide pour débuter" ➜ <a href="https://youtu.be/WBhNszyc_Ks?si=SM9WUHKc6TV16E6L">https://youtu.be/WBhNszyc_Ks?si=SM9WUHKc6TV16E6L</a>.',
        },
        {
          title: 'Quelle est la différence entre propriété et unité ?',
          content: 'Une propriété est un immeuble ou bâtiment. Une unité est une chambre, un studio ou un appartement à l’intérieur de cette propriété.',
        },
        {
          title: ' Comment ajouter une unité (chambre, studio...) ?',
          content: 'Une fois la propriété créée, cliquez sur « Ajouter une unité » pour y ajouter vos logements. <br/><br/> Voir la vidéo : "Créer une chambre dans un bien sur Ndewa360 – Guide pour débuter" ➜ <a href="https://youtu.be/-xTYP8uuKgk">https://youtu.be/-xTYP8uuKgk</a>.',
        },
        {
          title: 'Puis-je ajouter une visite 360° moi-même ?',
          content: 'Oui, si vous disposez d\'une vidéo ou d\'une photo 360°. Sinon, vous pouvez contacter notre équipe pour assistance..',
        },
        {
          title: 'Comment ajouter un locataire ?',
          content: 'Rendez-vous sur l’unité concernée, puis cliquez sur le menu «Locataires» ensuite sur le bouton « Ajouter un locataire ».',
        },
        {
          title: 'Comment enregistrer un paiement ?',
          content: 'Choisissez le bien concerné puis allez sur la liste des locataires à partir du menu « Locataires »   ou sur la liste des unités du menu « Unités », ensuite sur le locataire ou l\'unité concernée, puis cliquez sur « Ajouter un paiement ». Vous pouvez y préciser la période, le montant, et autre. <br/><br/> Voir la vidéo : "Ajouter un paiement – Guide pour débuter" ➜ <a href="https://youtu.be/-xTYP8uuKgk">https://youtu.be/-xTYP8uuKgk</a>.',
        },
        {
          title: 'Est-ce que le locataire reçoit une notification ?',
          content: 'Oui, un email de confirmation est automatiquement envoyé au locataire une fois le paiement enregistré.',
        },
        {
          title: 'Où puis-je suivre mes revenus mensuels ?',
          content: 'Le tableau de bord financier vous affiche tous les paiements, répartis par mois et par propriété. Un recapitulatif des biens de propriétés est tout dabord disponible sur l\'espace de l\'ensemble des biens (menu « Biens immobilier »), mais un tableau de bord financier complet est disponible sur le menu « Finances » de chaque bien immobilier',
        },
        {
          title: 'Est-ce que je peux télécharger un contrat ou une facture ?',
          content: 'Oui. Vous pouvez générer automatiquement les contrats et les factures à partir du profil du locataire',
        },
      ]
    },
    {
      groupName: 'Pour les locataires',
      children: [
        {
          title: 'Comment chercher un logement sur Ndewa360 ?',
          content: 'Depuis la page d’accueil, et à partir du menu « Recherche de biens » utilisez le moteur de recherche. Filtrez par ville, type de logement, prix, etc.',
        },
        {
          title: 'Qu’est-ce qu’une visite 360° ?',
          content: 'C’est une vue immersive du logement. Vous pouvez vous déplacer virtuellement à l’intérieur comme si vous y étiez.',
        },
        {
          title: 'Est-ce que je dois payer pour voir la visite 360° ?',
          content: 'Non, la visite immersive est entiérement gratuite',
        },
        {
          title: 'Comment contacter le propriétaire ?',
          content: 'Contre un paiement, vous aurez accès à ses coordonnées (téléphone, WhatsApp ou email)',
        },
        {
          title: 'Comment savoir si un logement est encore disponible ?',
          content: 'Seuls les logements non encore loués apparaissent dans les résultats de recherche.',
        },
      ]
    },
    {
      groupName: 'Problèmes techniques / Contact support',
      children: [
        {
          title: 'Je ne reçois pas d’email, que faire ?',
          content: 'Vérifiez dans vos spams. Sinon, utilisez le formulaire de contact ou réessayez avec un autre email.',
        },
        {
          title: ' J’ai fait un paiement mais je n’ai pas accès au mon espace membre. Que faire?',
          content: ' Contactez notre support avec la preuve de paiement. Nous activerons votre accès manuellement si nécessaire.',
        },
        {
          title: 'Comment contacter l’assistance ?',
          content: ' Via le formulaire dans la page "Support", ou par email à <a href="mailto:support@ndewa-360.com">support@ndewa-360.com</a>.',
        }
      ]
    }

  ]

  constructor(
    private location: Location
  ) {
  }

  ngOnInit(): void {

  }

  goBack()
  {
    this.location.back();
  }
}

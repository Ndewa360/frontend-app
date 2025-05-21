import {Component, OnInit} from '@angular/core'
import {DomSanitizer} from '@angular/platform-browser'
import { Observable } from 'rxjs'
import { Select, Store } from '@ngxs/store'
import { UserProfileAction, UserProfileModel, UserProfileState } from 'src/app/shared/store'

@Component({
  selector: 'app-getting-started',
  templateUrl: './getting-started.component.html',
  styleUrls: ['./getting-started.component.css']
})
export class GettingStartedComponent implements OnInit {
  @Select(UserProfileState.selectStateUserProfile) userProfil$:Observable<UserProfileModel>
  routingLink="/support/home"

  public videos = [
    {
      title: 'Introduction à Ndewa360',
      topic: 'tutoriels vidéo',
      url: 'https://www.youtube.com/embed/F4xu5FXW62k',
      seen: true,
      steps: [
      ],
      page: 'Présentation général',
      info: 'Présentation général de l\'application.',
    },
    {
      title: 'Creation de compte',
      topic: 'Gestion du profil',
      url: 'https://www.youtube.com/embed/gyin31wzg4Q',
      seen: true,
      steps: [
        'Cliquer sur \'S\'inscrire\'',
        'Remplir le formulaire',
        'Accepter les conditions générales',
        'Soumettre le formulaire',
        'Vérifiez votre email',
        'Connectez-vous à votre compte',
      ],
      page: 'Création de compte & Connexion',
      info: 'Processus complet de création de compte avec confirmation de l\'adresse email',
    },
    {
      title: 'Ajout de bien immobilier',
      topic: 'Gestion de bien',
      url: 'https://www.youtube.com/embed/WBhNszyc_Ks',
      steps: [
        'Connectez-vous à votre compte',
        'Cliquer sur \'Bien immobilier\'',
        'Cliquer sur  \'Nouveau\'',
        'Remplir le formulaire',
        'Soumettre le formulaire',
        'Acceder au panel de gestion du bien',
      ],
      page: 'Bien immobilier',
      info: 'Processus de création d\'un bien immobiliér dans un localité précise en tenant compte de la ville et du pays.',
    },
    {
      title: 'Ajout d\'une unité locative',
      topic: 'Gestion d\'unité locative',
      url: 'https://www.youtube.com/embed/7rkeORD4jSw',
      steps: [
        'Connectez-vous à votre compte',
        'Cliquer sur \'Bien immobilier\'',
        'Cliquer sur \'Unité\'',
        'Cliquer sur \'Ajouter une unité\'',
        'Remplir le formulaire',
        'Soumettre le formulaire',
        'Voir l\'unité nouvellement créée',
      ],
      page: 'Unités',
      info: 'Processus de création d\'une unité locative (chambre, studio ou appartement) à l\'intérieur d\'un bien immobilier.',
    },
    {
      title: 'Ajout d\'un locataire',
      topic: 'Gestion de locataire',
      url: 'https://www.youtube.com/embed/Bsq5cKkS33I',
      steps: [
        'Connectez-vous à votre compte',
        'Cliquer sur \'Bien immobilier\'',
        'Cliquer sur \'Locataires\'',
        'Cliquer sur \'Ajouter un locataire\'',
        'Remplir le formulaire',
        'Soumettre le formulaire',
        'Voir le locataire nouvellement créée',
      ],
      page: 'Locataires',
      info: 'Processus de création d\'un locataire appartenant à un bien immobilier.',
    },
    {
      title: 'Assigner un locataire à une unité',
      topic: 'Gestion de location',
      url: 'https://www.youtube.com/embed/PH-2FfFD2PU',
      steps: [
        'Connectez-vous à votre compte',
        'Cliquer sur \'Bien immobilier\'',
        'Cliquer sur \'Voir locations\'',
        'Cliquer sur \'Nouveau contrat de location\'',
        'Remplir le formulaire',
        'Soumettre le formulaire',
        'Voir l\'assignation nouvellement effectué',
      ],
      page: 'Location',
      info: 'Processus d\'assignation d\'un locataire à une unité locative. Elle à pour conséquence de générer un contrat de location entre les deux parties et de les envoyer par mail.',
    },
    {
      title: 'Analyse financière d\'un bien',
      topic: 'Gestion financière',
      url: 'https://www.youtube.com/embed/PH-2FfFD2PU',
      steps: [
        'Connectez-vous à votre compte',
        'Cliquer sur \'Bien immobilier\'',
        'Cliquer sur \'Finances\'',
        'Choisir l\'année',
        'Consulter les états de paiements de l\'année choisie',
      ],
      page: 'Finnace',
      info: 'Processus d\'analyse des états financiers d\'un bien immobilier en fonction d\'une année d\'activité',
    }
  ]

  constructor(private sanitizer: DomSanitizer) {
  }

  ngOnInit(): void {
    this.userProfil$.subscribe((user)=>{if(user) this.routingLink="/app/welcome"})
  }

  getUrl(url) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url)
  }

  trackByFn(index, row) {
    return row.title
  }

}

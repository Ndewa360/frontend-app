import { Injectable } from "@angular/core";
import  { driver } from 'driver.js';

@Injectable({
    providedIn:'root'
})
export class TutorialsService
{
    private driver;

    constructor() {
        this.driver = driver({
          showProgress: true, // Afficher la progression
          overlayOpacity: 0.7, // Opacité du fond
          allowClose: true, // Permettre de fermer le tutoriel
          doneBtnText: 'Terminé',
        //   closeBtnText: 'Fermer',
          nextBtnText: 'Suivant',
          prevBtnText: 'Précédent',
          steps: [
            {
              element: '.btn-start',
              popover: {
                title: 'Bienvenue sur Ndewa360',
                description: "Cette plateforme vous permet de gérer vos biens immobiliers facilement. <br><br>📌 Suivez ce guide interactif pour découvrir les principales fonctionnalités !",
                side: 'bottom'
              }
            },
            {
              element: '#search-menu-btn',
              popover: {
                title: 'Recherche',
                description: 'Faite une recherche dans votre espace.',
                side: 'right'
              }
            },
            {
              element: '#home-menu-btn',
              popover: {
                title: 'Bien immobilier',
                description: 'Ajouter, modifié et gérer vos appartements, chambres ou studio simplement.',
                side: 'left'
              }
            },
            {
              element: '#billing-menu-btn',
              popover: {
                title: 'Facturation',
                description: 'Accedé à votre facturation',
                side: 'left'
              }
            },
            {
              element: 'home',
              popover: {
                title: 'Vous êtes fin prêt!',
                description: 'N’hésitez pas à revenir à ce tutoriel à tout moment en cliquant sur Aide > Tutoriel dans le menu. <br>Bonne gestion et à bientôt sur !',
                side: 'left'
              }
            }
          ]
        });
      }

      startTour() {
    
        this.driver.drive();
      }
}
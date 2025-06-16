import { Component, OnInit, OnDestroy, Renderer2, ViewChild, ElementRef } from '@angular/core';
import { Store } from '@ngxs/store';
import { RefreshTokenService } from './shared/store/auth-token/refresh-token.service';
import { AuthTokenState } from './shared/store/auth-token';
import { interval, Subscription } from 'rxjs';
import { LOCAL_LANGUAGE, UserProfileAction } from './shared/store';
import { Title, Meta } from '@angular/platform-browser';
import { Router, ActivatedRoute, NavigationCancel, NavigationEnd, NavigationStart } from '@angular/router';
import { SettingsService } from 'src/@youpez';
import { TutorialsService } from './shared/services/tutorials/tutorials.service';
import * as moment from 'moment';

const getSessionStorage = (key) => {
  return sessionStorage.getItem(key)
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  private tokenCheckInterval: Subscription;
  private userProfileCheckInterval: Subscription;
  private appLoaded: boolean = false
  

  @ViewChild('topScroll') topScroll: ElementRef;

  constructor(
    private store: Store,
    private refreshTokenService: RefreshTokenService,
    private renderer: Renderer2,
    private settingsService: SettingsService,
    private router: Router,
    private route: ActivatedRoute,
    private tutorialService: TutorialsService,
    private activatedRoute: ActivatedRoute,
    private titleService: Title, 
    private meta: Meta
  ) {}

  ngOnInit(): void {
     this.activatedRoute.fragment.subscribe((fragment: string | null) => {
      if (fragment) this.jumpToSection(fragment);
    });

    moment.locale(LOCAL_LANGUAGE.FR.toString())
    this.route.queryParams
      .subscribe((queryParams) => {
        if (queryParams['theme']) {
          this.settingsService.setTheme(queryParams['theme'])
        }
        else {
          this.settingsService.setTheme(getSessionStorage('--app-theme'))
        }

        if (queryParams['sidebar']) {
          this.settingsService.setSideBar(queryParams['sidebar'])
        }
        else {
          this.settingsService.setSideBar(getSessionStorage('--app-theme-sidebar'))
        }

        if (queryParams['header']) {
          this.settingsService.setHeader(queryParams['header'])
        }
        else {
          this.settingsService.setHeader(getSessionStorage('--app-theme-header'))
        }
      })
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {

      }
      if (event instanceof NavigationEnd) {
        if (!this.appLoaded) {
          (<any>window).appBootstrap()
          this.appLoaded = true
        }
      }
      if (event instanceof NavigationCancel) {

      }
    })

    //Meta Tag
    this.titleService.setTitle('Ndewa360 - Location Immobilière en 360° au Cameroun');
    this.meta.addTags([
      { name: 'description', content: 'Explorez des logements en 360°, trouvez des chambres,studios et appartements à louer facilement. Ndewa360 simplifie la recherche et la gestion immobilière.' },
      { name: 'keywords', content: 'location, logement, immobilier, Cameroun, 360°, étudiants, unités à louer, propriétaires, gestion immobilière' },
      { name: 'author', content: 'Ndewa360' },
      { property: 'og:title', content: 'Ndewa360 - Location Immobilière en 360°' },
      { property: 'og:description', content: 'Trouvez ou gérez des logements facilement au Cameroun grâce à Ndewa360. Visite virtuelle, gestion simplifiée, 100% digital.' },
      { property: 'og:url', content: 'https://ndewa-360.com' },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: 'https://ndewa-360.com/assets/img/logo/logo-basic.png' }, // image à ajuster selon ton projet
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Ndewa360 - Location Immobilière en 360°' },
      { name: 'twitter:description', content: 'Explorez et gérez vos logements facilement au Cameroun.' },
      { name: 'twitter:image', content: 'https://ndewa-360.com/assets/img/logo/logo-basic.png' }
    ]);

    // Vérifier l'état du token toutes les 5 minutes
    this.tokenCheckInterval = interval(5 * 60 * 1000).subscribe(() => {
      const isLoggedIn = this.store.selectSnapshot(AuthTokenState.selectStateUserIsLogin);
      if (isLoggedIn) {
        this.refreshTokenService.checkTokenExpiration();
      }
    });

    // Vérifier si le profil utilisateur est chargé toutes les 30 secondes
    this.userProfileCheckInterval = interval(30 * 1000).subscribe(() => {
      const isLoggedIn = this.store.selectSnapshot(AuthTokenState.selectStateUserIsLogin);
      if (isLoggedIn) {
        this.store.dispatch(new UserProfileAction.FetchUserProfile());
      }
    });

    // Charger le profil utilisateur au démarrage de l'application
    const isLoggedIn = this.store.selectSnapshot(AuthTokenState.selectStateUserIsLogin);
    if (isLoggedIn) {
      this.store.dispatch(new UserProfileAction.FetchUserProfile());
    }
  }

  jumpToSection(section: string | null) {
    console.log("Section ",section, document.getElementById(section));
    if (section) document.getElementById(section)?.scrollIntoView({ behavior: 'smooth' });
  }


  ngOnDestroy(): void {
    // Nettoyer les abonnements pour éviter les fuites de mémoire
    if (this.tokenCheckInterval) {
      this.tokenCheckInterval.unsubscribe();
    }
    if (this.userProfileCheckInterval) {
      this.userProfileCheckInterval.unsubscribe();
    }
  }
}
import {Component, ElementRef, OnInit, ViewChild} from '@angular/core'
import {Router, ActivatedRoute, NavigationStart, NavigationEnd, NavigationCancel} from "@angular/router"
import {environment} from "../environments/environment"
import {SettingsService} from "src/@youpez/services/settings.service"
import { interval, switchMap, of, filter, take } from 'rxjs'
import { TutorialsService } from './shared/services/tutorials/tutorials.service'
import { Currency, LOCAL_LANGUAGE } from 'src/app/shared/store'
import * as moment from 'moment';
import { Title, Meta } from '@angular/platform-browser'

const getSessionStorage = (key) => {
  return sessionStorage.getItem(key)
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  private appLoaded: boolean = false
  

@ViewChild('topScroll') topScroll: ElementRef;

  constructor(private settingsService: SettingsService,
              private router: Router,
              private route: ActivatedRoute,
              private tutorialService: TutorialsService,
              private activatedRoute: ActivatedRoute,
              private titleService: Title, 
              private meta: Meta
            ) {

  }

  ngOnInit(): void {
    // this.tutorialService.startTour();
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
      { name: 'description', content: 'Explorez des logements en 360°, trouvez des chambres et appartements à louer facilement. Ndewa360 simplifie la recherche et la gestion immobilière.' },
      { name: 'keywords', content: 'location, logement, immobilier, Cameroun, 360°, étudiants, chambres à louer, propriétaires, gestion immobilière' },
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
  }

  jumpToSection(section: string | null) {
    console.log("Section ",section, document.getElementById(section));
    if (section) document.getElementById(section)?.scrollIntoView({ behavior: 'smooth' });
  }

  ngAfterViewInit()
  {
    // this.topScroll.nativeElement.scrollTop = 0;
  }
}

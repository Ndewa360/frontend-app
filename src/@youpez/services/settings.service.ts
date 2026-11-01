import {Injectable, EventEmitter} from '@angular/core'
import {DOCUMENT} from '@angular/common'
import {Inject} from "@angular/core"
import {BehaviorSubject} from 'rxjs'

import {environment} from "../../environments/environment"
import {getLightEchartsTheme, getDarkEchartsTheme, appThemes, headerThemes, sideBarThemes} from "../helpers"

// echarts est chargé en différé : les composants `youpez-echarts` ne sont
// utilisés dans aucun template de l'application (ChartsModule a été retiré de
// l'arbre de modules). L'import statique de `registerTheme` tirait pourtant
// toute la lib echarts (~1,5 Mo) dans le bundle critique, car SettingsService
// est injecté dans AppComponent (racine, chargée en premier). Le chargement
// différé ne coûte qu'un petit chunk envoyé uniquement si besoin.
let _echartsModule: Promise<any> | null = null
const getEchartsModule = (): Promise<any> => {
  if (!_echartsModule) {
    _echartsModule = import('echarts/lib/echarts')
  }
  return _echartsModule
}

const checkClass = (arr: any[], name: any) => {
  return arr.some(el => el.name === name)
}

const saveSessionStorage = (key: string, value: string) => {
  try { sessionStorage.setItem(key, value) } catch {}
}

/** Préférence de thème mémorisée sur l'appareil : 'auto' | 'light' | 'dark'. */
export const THEME_PREFERENCE_KEY = 'ndewa-theme-preference'
export type ThemePreference = 'auto' | 'light' | 'dark'

export function readThemePreference(): ThemePreference | null {
  try {
    const value = localStorage.getItem(THEME_PREFERENCE_KEY)
    return value === 'auto' || value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  private theme = new BehaviorSubject<any>({
    theme: '',
    sidebar: '',
    header: '',
  })
  public $theme = this.theme.asObservable()
  public themeChanged: EventEmitter<any> = new EventEmitter()

  /** Préférence choisie (« Automatique » suit le réglage clair/sombre de l'appareil). */
  private preference: ThemePreference = 'light'
  private systemDarkQuery?: MediaQueryList
  private readonly onSystemThemeChange = () => {
    if (this.preference === 'auto') this.setTheme(this.resolvePreference('auto'))
  }

  constructor(@Inject(DOCUMENT) private document: Document) {
  }

  /**
   * Applique et mémorise une préférence de thème. Le thème était gardé pour
   * la session seulement (perdu à la fermeture du navigateur) et le choix fait
   * dans le profil n'était jamais appliqué.
   */
  public setThemePreference(preference: string | null | undefined) {
    const pref: ThemePreference = preference === 'dark' || preference === 'auto' ? preference : 'light'
    this.preference = pref
    try { localStorage.setItem(THEME_PREFERENCE_KEY, pref) } catch {}
    this.watchSystemTheme(pref === 'auto')
    this.setTheme(this.resolvePreference(pref))
  }

  public getThemePreference(): ThemePreference {
    return this.preference
  }

  private resolvePreference(pref: ThemePreference): 'light' | 'dark' {
    if (pref !== 'auto') return pref
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    } catch {
      return 'light'
    }
  }

  private watchSystemTheme(enabled: boolean) {
    if (typeof window === 'undefined' || !window.matchMedia) return
    if (!this.systemDarkQuery) this.systemDarkQuery = window.matchMedia('(prefers-color-scheme: dark)')
    this.systemDarkQuery.removeEventListener('change', this.onSystemThemeChange)
    if (enabled) this.systemDarkQuery.addEventListener('change', this.onSystemThemeChange)
  }

  public setTheme(name: any) {
    if (this.theme.value.theme === name) {
      return
    }
    if (checkClass(appThemes, name)) {
      this.loadTheme(name)
      this.emitThemeEvent('theme', name)
      saveSessionStorage('--app-theme', name)
      // Choix explicite (panneau d'apparence) : mémorisé sur l'appareil, sauf
      // quand il résulte de la préférence « Automatique ».
      if (this.preference !== 'auto') {
        this.preference = name === 'dark' ? 'dark' : 'light'
        try { localStorage.setItem(THEME_PREFERENCE_KEY, this.preference) } catch {}
      }
    }
    else {
      this.loadTheme('light')
      this.emitThemeEvent('theme', 'light')
    }
  }

  public setSideBar(name: any) {
    if (this.theme.value.sidebar === name) {
      return
    }
    if (checkClass(sideBarThemes, name)) {
      this.changeThemeClassHelper(sideBarThemes, name)
      this.emitThemeEvent('sidebar', name)
      saveSessionStorage('--app-theme-sidebar', name)
    }
    else {
      this.changeThemeClassHelper(sideBarThemes, 'black')
    }
  }

  public setHeader(name: any) {
    if (this.theme.value.header === name) {
      return
    }
    if (checkClass(headerThemes, name)) {
      this.changeThemeClassHelper(headerThemes, name)
      this.emitThemeEvent('header', name)
      saveSessionStorage('--app-theme-header', name)
    }
    else {
      this.changeThemeClassHelper(headerThemes, 'black')
    }
  }

  private emitThemeEvent(key: string, value: string) {
    const nextValue = {
      ...this.theme.value,
      [key]: value,
    }
    this.theme.next(nextValue)
  }

  private removeTheme(themeName: string) {
    const rootEl = document.querySelector('html')
    const classList = [].slice.apply(rootEl.classList)

    if (classList.includes(themeName)) {
      rootEl.classList.remove(themeName)
    }
  }

  private setClass(themeName: string) {
    const rootEl = document.querySelector('html')
    const classList = [].slice.apply(rootEl.classList)

    if (!classList.includes(themeName)) {
      rootEl.classList.add(themeName)
    }
  }

  private changeThemeClassHelper(themes: any[], name: string) {
    themes
      .filter((el: { name: any }) => el.name !== name)
      .forEach((el: { theme: any }) => {
        this.removeTheme(el.theme)
      })

    themes
      .filter((el: { name: any }) => el.name === name)
      .forEach((el: { theme: any }) => {
        this.setClass(el.theme)
      })
  }

  private loadTheme(theme: string) {
    if (theme === 'light') {
      this.loadLightTheme()
    }
    else if (theme === 'dark') {
      this.loadDarkTheme()
    }
    else {
      this.loadLightTheme()
    }
  }

  private loadLightTheme() {
    this.registerEchartsThemes(getDarkEchartsTheme(), getLightEchartsTheme())
    this.removeTheme('app-theme--dark')
    this.removeTheme('dark')
    this.setClass('app-theme--light')
    this.loadStyle('theme-light.css')
  }

  private loadDarkTheme() {
    this.registerEchartsThemes(getLightEchartsTheme(), getDarkEchartsTheme())
    this.removeTheme('app-theme--light')
    this.setClass('app-theme--dark')
    // Classe attendue par Tailwind (darkMode: 'class') : active les variantes dark:.
    this.setClass('dark')
    this.loadStyle('theme-dark.css')
  }

  private registerEchartsThemes(inverseTheme: any, defaultTheme: any) {
    getEchartsModule()
      .then((echarts: any) => {
        echarts.registerTheme('inverse', inverseTheme)
        echarts.registerTheme('default', defaultTheme)
      })
      .catch(() => {})
  }

  private loadStyle(styleName: string) {
    const head = this.document.getElementsByTagName('head')[0]
    let themeLink = this.document.getElementById('client-theme') as HTMLLinkElement

    if (themeLink) {
      themeLink.href = styleName
    }
    else {
      const style = this.document.createElement('link')
      style.id = 'client-theme'
      style.type = 'text/css'
      style.rel = 'stylesheet'
      style.href = `${styleName}`
      head.prepend(style)
    }
  }
}

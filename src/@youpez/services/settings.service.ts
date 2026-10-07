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
  return sessionStorage.setItem(key, value)
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

  constructor(@Inject(DOCUMENT) private document: Document) {
  }

  public setTheme(name: any) {
    if (this.theme.value.theme === name) {
      return
    }
    if (checkClass(appThemes, name)) {
      this.loadTheme(name)
      this.emitThemeEvent('theme', name)
      saveSessionStorage('--app-theme', name)
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
    this.setClass('app-theme--light')
    this.loadStyle('theme-light.css')
  }

  private loadDarkTheme() {
    this.registerEchartsThemes(getLightEchartsTheme(), getDarkEchartsTheme())
    this.removeTheme('app-theme--light')
    this.setClass('app-theme--dark')
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

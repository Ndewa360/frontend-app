import { Injectable } from '@angular/core';
import { Store, Select } from '@ngxs/store';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { AuthTokenState } from '../store/auth-token/auth-token.state';
import { UserProfileState } from '../store/user-profile/user-profile.state';
import { UserProfileAction } from '../store/user-profile/user-profile.actions';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthStateService {

  @Select(AuthTokenState.selectStateAuthToken) token$: Observable<string>;
  @Select(UserProfileState.selectStateUserProfile) userProfile$: Observable<any>;
  @Select(UserProfileState.selectStateLoading) profileLoading$: Observable<boolean>;

  private readonly isAuthenticated$ = new BehaviorSubject<boolean>(false);
  private readonly shouldLoadProfile$ = new BehaviorSubject<boolean>(false);

  // Pages publiques qui ne nécessitent pas de connexion
  private readonly publicRoutes = [
    '/',
    '/home',
    '/search',
    '/auth/signin',
    '/auth/signup',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/public'
  ];

  constructor(
    private store: Store,
    private router: Router
  ) {
    this.initializeAuthState();
  }

  /**
   * Initialise la surveillance de l'état d'authentification
   */
  private initializeAuthState(): void {
    // Surveiller le token pour déterminer l'état d'authentification
    this.token$.subscribe(token => {
      const isAuth = !!token;
      this.isAuthenticated$.next(isAuth);
      
      // Déterminer si on doit charger le profil
      const currentRoute = this.router.url;
      const shouldLoad = isAuth && !this.isPublicRoute(currentRoute);
      this.shouldLoadProfile$.next(shouldLoad);
      
      console.log('🔐 État d\'authentification:', {
        isAuthenticated: isAuth,
        currentRoute,
        shouldLoadProfile: shouldLoad
      });
    });
  }

  /**
   * Vérifie si une route est publique
   */
  private isPublicRoute(route: string): boolean {
    return this.publicRoutes.some(publicRoute => {
      if (publicRoute === '/') {
        return route === '/' || route === '';
      }
      return route.startsWith(publicRoute);
    });
  }

  /**
   * Charge le profil utilisateur de manière conditionnelle
   */
  loadUserProfileConditionally(forceRedirectOnError: boolean = false): void {
    const isAuth = this.isAuthenticated$.value;
    const currentRoute = this.router.url;
    const isPublic = this.isPublicRoute(currentRoute);

    console.log('👤 Chargement conditionnel du profil:', {
      isAuthenticated: isAuth,
      currentRoute,
      isPublicRoute: isPublic,
      forceRedirectOnError
    });

    if (isAuth) {
      // Utilisateur connecté : charger le profil
      this.store.dispatch(new UserProfileAction.FetchUserProfileConditional(forceRedirectOnError));
    } else if (!isPublic) {
      // Utilisateur non connecté sur page privée : rediriger
      console.log('🚫 Accès non autorisé à une page privée');
      this.router.navigateByUrl('/auth/signin');
    } else {
      // Utilisateur non connecté sur page publique : ne rien faire
      console.log('✅ Accès autorisé à une page publique');
    }
  }

  /**
   * Charge le profil utilisateur (version classique pour les pages privées)
   */
  loadUserProfile(): void {
    this.loadUserProfileConditionally(true);
  }

  /**
   * Obtient l'état d'authentification
   */
  isAuthenticated(): Observable<boolean> {
    return this.isAuthenticated$.asObservable();
  }

  /**
   * Obtient l'état d'authentification (valeur synchrone)
   */
  isAuthenticatedValue(): boolean {
    return this.isAuthenticated$.value;
  }

  /**
   * Vérifie si on doit charger le profil
   */
  shouldLoadProfile(): Observable<boolean> {
    return this.shouldLoadProfile$.asObservable();
  }

  /**
   * Obtient le profil utilisateur
   */
  getUserProfile(): Observable<any> {
    return this.userProfile$;
  }

  /**
   * Obtient l'état de chargement du profil
   */
  isProfileLoading(): Observable<boolean> {
    return this.profileLoading$;
  }

  /**
   * Vérifie si l'utilisateur est sur une page publique
   */
  isOnPublicPage(): boolean {
    return this.isPublicRoute(this.router.url);
  }

  /**
   * Vérifie si l'utilisateur est sur une page privée
   */
  isOnPrivatePage(): boolean {
    return !this.isOnPublicPage();
  }

  /**
   * Obtient un observable combiné de l'état d'authentification et du profil
   */
  getAuthState(): Observable<{isAuthenticated: boolean, profile: any, isLoading: boolean}> {
    return combineLatest([
      this.isAuthenticated(),
      this.getUserProfile(),
      this.isProfileLoading()
    ]).pipe(
      map(([isAuthenticated, profile, isLoading]) => ({
        isAuthenticated,
        profile,
        isLoading
      })),
      distinctUntilChanged((prev, curr) => 
        prev.isAuthenticated === curr.isAuthenticated &&
        prev.profile?._id === curr.profile?._id &&
        prev.isLoading === curr.isLoading
      )
    );
  }

  /**
   * Ajoute une route publique
   */
  addPublicRoute(route: string): void {
    if (!this.publicRoutes.includes(route)) {
      this.publicRoutes.push(route);
    }
  }

  /**
   * Supprime une route publique
   */
  removePublicRoute(route: string): void {
    const index = this.publicRoutes.indexOf(route);
    if (index > -1) {
      this.publicRoutes.splice(index, 1);
    }
  }

  /**
   * Obtient la liste des routes publiques
   */
  getPublicRoutes(): string[] {
    return [...this.publicRoutes];
  }
}

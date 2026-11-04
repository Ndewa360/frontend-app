import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthStateService } from './auth-state.service';

const STORAGE_KEY = 'ndewa_favorites';
const LEGACY_KEY = 'ndiye_favorites';

/**
 * Logements favoris.
 *
 * - Connecté : enregistrés sur le compte (`/favorites`), donc retrouvés sur un
 *   autre navigateur et dans l'application mobile. Les favoris pris sur
 *   l'appareil avant la connexion sont fusionnés puis effacés localement.
 * - Visiteur : gardés dans le navigateur.
 */
@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly api = `${environment.apiUrl}/favorites`;
  private readonly ids$ = new BehaviorSubject<Set<string>>(this.readLocal());
  private authenticated = false;

  constructor(private http: HttpClient, private authState: AuthStateService) {
    this.authState.isAuthenticated()
      .pipe(
        distinctUntilChanged(),
        switchMap((isAuth) => {
          this.authenticated = isAuth;
          if (!isAuth) return of(this.readLocal());
          const local = [...this.readLocal()];
          const load$ = local.length
            ? this.http.post<any>(`${this.api}/merge`, { ids: local.slice(0, 100) })
            : this.http.get<any>(this.api);
          return load$.pipe(
            map((res) => {
              if (local.length) this.writeLocal(new Set());
              return new Set<string>(res?.data?.ids ?? []);
            }),
            catchError(() => of(this.readLocal())),
          );
        }),
      )
      .subscribe((ids) => this.ids$.next(ids));
  }

  /** Identifiants des favoris (mis à jour à chaque changement). */
  favorites(): Observable<Set<string>> {
    return this.ids$.asObservable();
  }

  has(roomId: string): boolean {
    return this.ids$.value.has(roomId);
  }

  list(): string[] {
    return [...this.ids$.value];
  }

  /** Ajoute ou retire un favori (affichage immédiat, annulé si le serveur refuse). */
  toggle(roomId: string): void {
    const before = this.ids$.value;
    const next = new Set(before);
    const adding = !next.has(roomId);
    if (adding) next.add(roomId); else next.delete(roomId);
    this.ids$.next(next);

    if (!this.authenticated) {
      this.writeLocal(next);
      return;
    }
    const call$ = adding
      ? this.http.put<any>(`${this.api}/${roomId}`, {})
      : this.http.delete<any>(`${this.api}/${roomId}`);
    call$.subscribe({
      next: (res) => this.ids$.next(new Set<string>(res?.data?.ids ?? [...next])),
      error: () => this.ids$.next(before),
    });
  }

  private readLocal(): Set<string> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_KEY);
      const list = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(list) ? list.filter((id) => typeof id === 'string' && /^[0-9a-f]{24}$/i.test(id)) : []);
    } catch {
      return new Set();
    }
  }

  private writeLocal(ids: Set<string>): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
      localStorage.removeItem(LEGACY_KEY);
    } catch {
      // Stockage indisponible (navigation privée) : favoris gardés pour la session.
    }
  }
}

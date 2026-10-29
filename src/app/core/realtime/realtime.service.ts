import { Inject, Injectable, NgZone, OnDestroy, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Store } from '@ngxs/store';
import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';
import type { Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment';
import { AuthTokenState } from '../../shared/store/auth-token';
import { RealtimeEvent, RealtimeEventName, RealtimePayloads } from './realtime.events';

/**
 * Connexion temps réel unique avec le backend (Socket.IO).
 *
 * - Ouverte automatiquement quand l'utilisateur est connecté (salle
 *   `user:<id>` côté serveur), rouverte avec le nouveau jeton après un
 *   rafraîchissement, fermée à la déconnexion.
 * - Ouverte en mode anonyme quand une page de paiement publique suit une
 *   transaction.
 * - Le client Socket.IO est chargé à la demande : il n'alourdit pas le bundle
 *   initial.
 *
 * Le temps réel est un confort : chaque écran garde un polling lent de
 * secours, et rien ne casse si le socket est indisponible.
 */
@Injectable({ providedIn: 'root' })
export class RealtimeService implements OnDestroy {
  private socket: Socket | null = null;
  private currentToken: string | null = null;
  private connecting: Promise<void> | null = null;
  private readonly watchedPayments = new Set<string>();
  private readonly events$ = new Subject<{ event: string; data: any }>();
  private readonly tokenSub: Subscription | null = null;

  /** Vrai quand le socket est connecté. */
  readonly connected$ = new BehaviorSubject<boolean>(false);

  constructor(
    private readonly store: Store,
    private readonly zone: NgZone,
    @Inject(PLATFORM_ID) private readonly platformId: object,
  ) {
    if (!isPlatformBrowser(this.platformId)) return;
    this.tokenSub = this.store
      .select(AuthTokenState.selectStateAuthToken)
      .pipe(distinctUntilChanged())
      .subscribe((token) => this.onTokenChange(token ?? null));
  }

  /** Flux typé d'un événement poussé par le serveur. */
  on<E extends RealtimeEventName>(event: E): Observable<RealtimePayloads[E]> {
    return this.events$.pipe(
      filter((m) => m.event === event),
      map((m) => m.data as RealtimePayloads[E]),
    );
  }

  /**
   * Suit le statut d'une transaction (page de paiement, y compris anonyme).
   * Se désabonner arrête le suivi.
   */
  watchPayment(externalRef: string): Observable<RealtimePayloads[typeof RealtimeEvent.PaymentStatus]> {
    return new Observable((subscriber) => {
      if (!isPlatformBrowser(this.platformId) || !externalRef) return undefined;
      this.watchedPayments.add(externalRef);
      this.ensureConnected().then(() => this.socket?.emit('payment.watch', { externalRef }));
      const sub = this.on(RealtimeEvent.PaymentStatus)
        .pipe(filter((p) => p.externalRef === externalRef))
        .subscribe(subscriber);
      return () => {
        sub.unsubscribe();
        this.watchedPayments.delete(externalRef);
        this.socket?.emit('payment.unwatch', { externalRef });
        if (!this.currentToken && this.watchedPayments.size === 0) this.disconnect();
      };
    });
  }

  ngOnDestroy(): void {
    this.tokenSub?.unsubscribe();
    this.disconnect();
  }

  private onTokenChange(token: string | null): void {
    if (token === this.currentToken) return;
    this.currentToken = token;
    // Le jeton est transmis à la connexion : un changement impose une reconnexion.
    this.disconnect();
    if (token || this.watchedPayments.size > 0) {
      this.ensureConnected();
    }
  }

  private ensureConnected(): Promise<void> {
    if (this.socket) return Promise.resolve();
    if (this.connecting) return this.connecting;
    this.connecting = import('socket.io-client')
      .then(({ io }) => {
        // Hors zone Angular : les battements du socket ne déclenchent pas de
        // détection de changements ; seuls les événements y sont ramenés.
        this.zone.runOutsideAngular(() => {
          const socket = io(environment.apiUrl, {
            transports: ['websocket', 'polling'],
            auth: this.currentToken ? { token: this.currentToken } : {},
            reconnectionDelayMax: 30_000,
          });
          socket.on('connect', () => {
            this.zone.run(() => this.connected$.next(true));
            // Après une reconnexion, le serveur a oublié les salles de paiement.
            this.watchedPayments.forEach((externalRef) => socket.emit('payment.watch', { externalRef }));
          });
          socket.on('disconnect', () => this.zone.run(() => this.connected$.next(false)));
          socket.on('auth.error', () => socket.disconnect());
          socket.onAny((event: string, data: unknown) => this.zone.run(() => this.events$.next({ event, data })));
          this.socket = socket;
        });
      })
      .catch(() => undefined)
      .finally(() => (this.connecting = null));
    return this.connecting;
  }

  private disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.connected$.next(false);
  }
}

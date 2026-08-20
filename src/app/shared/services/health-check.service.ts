import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngxs/store';
import { interval, Subscription, of } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { GlobalAction } from '../store';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class HealthCheckService implements OnDestroy {

  private healthSub: Subscription;
  private readonly HEALTH_URL = `${environment.apiUrl}/health`;
  private readonly CHECK_INTERVAL = 300000; // 5 minutes au lieu de 60s

  constructor(
    private http: HttpClient,
    private store: Store,
  ) {}

  start(): void {
    this.healthSub = interval(this.CHECK_INTERVAL).pipe(
      switchMap(() =>
        this.http.get<{ status: string }>(this.HEALTH_URL).pipe(
          catchError(() => of(null))
        )
      ),
      tap((res) => {
        const isConnected = res?.status === 'ok';
        const current = this.store.selectSnapshot(
          (state: any) => state.globals?.hasInternetConnexion
        );
        if (isConnected && !current) {
          this.store.dispatch(new GlobalAction.SetConnexionInternetState(true));
        }
      })
    ).subscribe();
  }

  stop(): void {
    this.healthSub?.unsubscribe();
  }

  ngOnDestroy(): void {
    this.stop();
  }
}

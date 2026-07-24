import { Injectable } from '@angular/core';
import { State, Action, StateContext, Selector } from '@ngxs/store';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { AdminBreachStateModel } from './admin-breach.model';
import { AdminBreachAction } from './admin-breach.actions';
import { AdminBreachService, BreachIncident } from '../../services/admin-breach.service';

@State<AdminBreachStateModel>({
  name: 'adminBreach',
  defaults: { incidents: [], selectedId: null, loading: false, saving: false },
})
@Injectable()
export class AdminBreachState {

  @Selector() static incidents(s: AdminBreachStateModel) { return s.incidents; }
  @Selector() static loading(s: AdminBreachStateModel)   { return s.loading; }
  @Selector() static saving(s: AdminBreachStateModel)    { return s.saving; }
  @Selector() static selected(s: AdminBreachStateModel) {
    return s.selectedId ? s.incidents.find(i => i._id === s.selectedId) ?? null : null;
  }

  constructor(private svc: AdminBreachService) {}

  @Action(AdminBreachAction.LoadAll)
  loadAll(ctx: StateContext<AdminBreachStateModel>, { status }: AdminBreachAction.LoadAll) {
    ctx.patchState({ loading: true });
    return this.svc.getAll(status).pipe(
      tap(incidents => ctx.patchState({ incidents, loading: false })),
      catchError(() => { ctx.patchState({ loading: false }); return of([]); })
    );
  }

  @Action(AdminBreachAction.Declare)
  declare(ctx: StateContext<AdminBreachStateModel>, { dto }: AdminBreachAction.Declare) {
    ctx.patchState({ saving: true });
    return this.svc.declare(dto).pipe(
      tap(incident => {
        const incidents = [incident, ...ctx.getState().incidents];
        ctx.patchState({ incidents, saving: false });
      }),
      catchError(() => { ctx.patchState({ saving: false }); return of(null); })
    );
  }

  @Action(AdminBreachAction.UpdateStatus)
  updateStatus(ctx: StateContext<AdminBreachStateModel>, { id, dto }: AdminBreachAction.UpdateStatus) {
    ctx.patchState({ saving: true });
    return this.svc.updateStatus(id, dto).pipe(
      tap(updated => {
        const incidents = ctx.getState().incidents.map(i => i._id === id ? updated : i);
        ctx.patchState({ incidents, saving: false });
      }),
      catchError(() => { ctx.patchState({ saving: false }); return of(null); })
    );
  }

  @Action(AdminBreachAction.SelectIncident)
  select(ctx: StateContext<AdminBreachStateModel>, { id }: AdminBreachAction.SelectIncident) {
    ctx.patchState({ selectedId: id });
  }
}

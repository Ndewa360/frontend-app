import { trackByFn } from '../../../../shared/utils/track-by.util';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store, Select } from '@ngxs/store';
import { TranslateModule } from '@ngx-translate/core';
import { Observable, Subject, interval } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { AdminBreachState } from '../../store/breach/admin-breach.state';
import { AdminBreachAction } from '../../store/breach/admin-breach.actions';
import { BreachIncident, CreateBreachDto } from '../../services/admin-breach.service';
import { SelectModule } from 'carbon-components-angular';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor, AsyncPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-admin-breach',
  templateUrl: './admin-breach.component.html',
  styleUrls: ['./admin-breach.component.scss'],
  standalone: true,
  imports: [TranslateModule, 
    NgIf,
    FormsModule,
    SelectModule,
    NgFor,
    AsyncPipe,
    DatePipe
  ]
})
export class AdminBreachComponent implements OnInit, OnDestroy {
  trackByFn = trackByFn;

  private destroy$ = new Subject<void>();

  @Select(AdminBreachState.incidents) incidents$: Observable<BreachIncident[]>;
  @Select(AdminBreachState.loading)   loading$: Observable<boolean>;
  @Select(AdminBreachState.saving)    saving$: Observable<boolean>;
  @Select(AdminBreachState.selected)  selected$: Observable<BreachIncident | null>;

  /** Heure courante, rafraîchie chaque minute pour le compte à rebours des 72 h. */
  now = Date.now();

  /** Incidents dont l'autorité n'est pas encore notifiée, du plus urgent au moins urgent. */
  pendingNotification$: Observable<BreachIncident[]>;

  filterStatus = '';
  showDeclareForm = false;
  showUpdatePanel = false;

  // Formulaire déclaration
  form: CreateBreachDto = {
    type: '',
    severity: '',
    description: '',
    affectedDataTypes: [],
    affectedUsersCount: 0,
    detectedAt: new Date().toISOString().slice(0, 16)
  };
  dataTypesInput = '';

  // Formulaire mise à jour statut
  updateForm = { status: '', resolutionNotes: '', authorityNotifiedAt: '' };

  readonly types = [
    { value: 'unauthorized_access', label: 'ADMIN.BREACH.TYPES.unauthorized_access' },
    { value: 'data_leak',           label: 'ADMIN.BREACH.TYPES.data_leak' },
    { value: 'bulk_export',         label: 'ADMIN.BREACH.TYPES.bulk_export' },
    { value: 'ransomware',          label: 'ADMIN.BREACH.TYPES.ransomware' },
    { value: 'accidental_exposure', label: 'ADMIN.BREACH.TYPES.accidental_exposure' },
    { value: 'other',               label: 'ADMIN.BREACH.TYPES.other' }
  ];

  readonly severities = [
    { value: 'low',      label: 'ADMIN.BREACH.SEVERITIES.low',    color: '#22c55e' },
    { value: 'medium',   label: 'ADMIN.BREACH.SEVERITIES.medium',     color: '#f59e0b' },
    { value: 'high',     label: 'ADMIN.BREACH.SEVERITIES.high',     color: '#f97316' },
    { value: 'critical', label: 'ADMIN.BREACH.SEVERITIES.critical',  color: '#ef4444' }
  ];

  readonly statuses = [
    { value: 'detected',      label: 'ADMIN.BREACH.STATUSES.detected' },
    { value: 'investigating', label: 'ADMIN.BREACH.STATUSES.investigating' },
    { value: 'notified',      label: 'ADMIN.BREACH.STATUSES.notified' },
    { value: 'resolved',      label: 'ADMIN.BREACH.STATUSES.resolved' }
  ];

  constructor(private store: Store) {}

  ngOnInit(): void {
    this.load();
    interval(60_000).pipe(takeUntil(this.destroy$)).subscribe(() => this.now = Date.now());
    this.pendingNotification$ = this.incidents$.pipe(
      map(list => (list || [])
        .filter(i => this.needsNotification(i))
        .sort((a, b) => new Date(a.notificationDeadline).getTime() - new Date(b.notificationDeadline).getTime()))
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  load(): void {
    this.store.dispatch(new AdminBreachAction.LoadAll(this.filterStatus || undefined));
  }

  selectIncident(incident: BreachIncident): void {
    this.store.dispatch(new AdminBreachAction.SelectIncident(incident._id));
    this.updateForm = { status: incident.status, resolutionNotes: '', authorityNotifiedAt: '' };
    this.showUpdatePanel = true;
    this.showDeclareForm = false;
  }

  closeDetail(): void {
    this.store.dispatch(new AdminBreachAction.SelectIncident(null));
    this.showUpdatePanel = false;
  }

  submitDeclare(): void {
    this.form.affectedDataTypes = this.dataTypesInput
      .split(',').map(s => s.trim()).filter(Boolean);
    this.store.dispatch(new AdminBreachAction.Declare({ ...this.form }));
    this.showDeclareForm = false;
    this.resetForm();
  }

  submitUpdate(id: string): void {
    const dto: any = { status: this.updateForm.status };
    if (this.updateForm.resolutionNotes)    dto.resolutionNotes    = this.updateForm.resolutionNotes;
    if (this.updateForm.authorityNotifiedAt) dto.authorityNotifiedAt = new Date(this.updateForm.authorityNotifiedAt).toISOString();
    this.store.dispatch(new AdminBreachAction.UpdateStatus(id, dto));
    this.showUpdatePanel = false;
  }

  /** Heures restantes avant la limite de notification (arrondi inférieur, jamais négatif). */
  hoursLeft(deadline: string): number {
    return Math.max(0, Math.floor((new Date(deadline).getTime() - this.now) / 3600000));
  }

  isOverdue(deadline: string): boolean {
    return new Date(deadline).getTime() < this.now;
  }

  /** L'autorité doit encore être notifiée : ni notifié ni résolu, et pas de date de notification. */
  needsNotification(incident: BreachIncident): boolean {
    return !incident.authorityNotifiedAt && incident.status !== 'notified' && incident.status !== 'resolved';
  }

  /** Moins de 24 h avant la limite. */
  isUrgent(incident: BreachIncident): boolean {
    return this.needsNotification(incident) && !this.isOverdue(incident.notificationDeadline) && this.hoursLeft(incident.notificationDeadline) < 24;
  }

  severityColor(severity: string): string {
    return this.severities.find(s => s.value === severity)?.color ?? '#6b7280';
  }

  severityLabel(severity: string): string {
    return this.severities.find(s => s.value === severity)?.label ?? severity;
  }

  statusLabel(status: string): string {
    return this.statuses.find(s => s.value === status)?.label ?? status;
  }

  typeLabel(type: string): string {
    return this.types.find(t => t.value === type)?.label ?? type;
  }

  private resetForm(): void {
    this.form = {
      type: '', severity: '', description: '',
      affectedDataTypes: [], affectedUsersCount: 0,
      detectedAt: new Date().toISOString().slice(0, 16)
    };
    this.dataTypesInput = '';
  }
}

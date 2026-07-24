import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store, Select } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AdminBreachState } from '../../store/breach/admin-breach.state';
import { AdminBreachAction } from '../../store/breach/admin-breach.actions';
import { BreachIncident, CreateBreachDto } from '../../services/admin-breach.service';

@Component({
  selector: 'app-admin-breach',
  templateUrl: './admin-breach.component.html',
  styleUrls: ['./admin-breach.component.scss'],
})
export class AdminBreachComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  @Select(AdminBreachState.incidents) incidents$: Observable<BreachIncident[]>;
  @Select(AdminBreachState.loading)   loading$: Observable<boolean>;
  @Select(AdminBreachState.saving)    saving$: Observable<boolean>;
  @Select(AdminBreachState.selected)  selected$: Observable<BreachIncident | null>;

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
    detectedAt: new Date().toISOString().slice(0, 16),
  };
  dataTypesInput = '';

  // Formulaire mise à jour statut
  updateForm = { status: '', resolutionNotes: '', authorityNotifiedAt: '' };

  readonly types = [
    { value: 'unauthorized_access', label: 'Accès non autorisé' },
    { value: 'data_leak',           label: 'Fuite de données' },
    { value: 'bulk_export',         label: 'Export massif suspect' },
    { value: 'ransomware',          label: 'Ransomware' },
    { value: 'accidental_exposure', label: 'Exposition accidentelle' },
    { value: 'other',               label: 'Autre' },
  ];

  readonly severities = [
    { value: 'low',      label: 'Faible',    color: '#22c55e' },
    { value: 'medium',   label: 'Moyen',     color: '#f59e0b' },
    { value: 'high',     label: 'Élevé',     color: '#f97316' },
    { value: 'critical', label: 'Critique',  color: '#ef4444' },
  ];

  readonly statuses = [
    { value: 'detected',      label: 'Détecté' },
    { value: 'investigating', label: 'En investigation' },
    { value: 'notified',      label: 'Autorité notifiée' },
    { value: 'resolved',      label: 'Résolu' },
  ];

  constructor(private store: Store) {}

  ngOnInit(): void {
    this.load();
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

  hoursLeft(deadline: string): number {
    return Math.round((new Date(deadline).getTime() - Date.now()) / 3600000);
  }

  isOverdue(deadline: string): boolean {
    return new Date(deadline) < new Date();
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
      detectedAt: new Date().toISOString().slice(0, 16),
    };
    this.dataTypesInput = '';
  }
}

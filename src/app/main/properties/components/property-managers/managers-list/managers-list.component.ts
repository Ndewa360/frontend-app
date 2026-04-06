import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngxs/store';
import { MatDialog } from '@angular/material/dialog';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PropertyManagerState, PropertyManagerAction, PropertyManagerAssignment, PERMISSION_LABELS, ManagerPermission } from 'src/app/shared/store/property-manager';
import { AssignManagerModalComponent } from '../assign-manager-modal/assign-manager-modal.component';

@Component({
  selector: 'app-managers-list',
  templateUrl: './managers-list.component.html',
  styleUrls: ['./managers-list.component.scss'],
})
export class ManagersListComponent implements OnInit, OnDestroy {
  @Input() propertyId: string;
  @Input() propertyName: string;

  managers$: Observable<PropertyManagerAssignment[]>;
  loading$: Observable<boolean>;
  private destroy$ = new Subject<void>();

  permissionLabels = PERMISSION_LABELS;

  constructor(private store: Store, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.managers$ = this.store.select(PropertyManagerState.selectPropertyManagers);
    this.loading$ = this.store.select(PropertyManagerState.selectLoadingManagers);
    this.loadManagers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadManagers(): void {
    if (this.propertyId) {
      this.store.dispatch(new PropertyManagerAction.LoadManagersForProperty(this.propertyId));
    }
  }

  openAssignModal(): void {
    const ref = this.dialog.open(AssignManagerModalComponent, {
      width: '600px',
      maxWidth: '95vw',
      disableClose: true,
      panelClass: 'manager-modal-panel',
      data: { propertyId: this.propertyId, propertyName: this.propertyName },
    });

    ref.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) this.loadManagers();
    });
  }

  revokeManager(assignmentId: string): void {
    if (!confirm('Êtes-vous sûr de vouloir révoquer ce gérant ?')) return;
    this.store.dispatch(new PropertyManagerAction.RevokeManager(assignmentId));
  }

  getPermissionLabel(perm: ManagerPermission): string {
    return this.permissionLabels[perm] || perm;
  }

  getActiveManagers(managers: PropertyManagerAssignment[]): PropertyManagerAssignment[] {
    return managers.filter(m => m.status === 'ACTIVE');
  }
}

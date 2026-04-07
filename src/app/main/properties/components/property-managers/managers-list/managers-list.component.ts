import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngxs/store';
import { MatDialog } from '@angular/material/dialog';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { PropertyManagerState, PropertyManagerAction, PropertyManagerAssignment, PERMISSION_LABELS, ManagerPermission } from 'src/app/shared/store/property-manager';
import { AssignManagerModalComponent } from '../assign-manager-modal/assign-manager-modal.component';
import { RevokeConfirmModalComponent } from '../revoke-confirm-modal/revoke-confirm-modal.component';
import { EditPermissionsModalComponent } from '../edit-permissions-modal/edit-permissions-modal.component';

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

  constructor(
    private store: Store,
    private dialog: MatDialog,
    private translate: TranslateService,
  ) {}

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

  openEditPermissionsModal(manager: PropertyManagerAssignment): void {
    const ref = this.dialog.open(EditPermissionsModalComponent, {
      width: '620px',
      maxWidth: '95vw',
      disableClose: true,
      panelClass: 'manager-modal-panel',
      data: {
        assignment: manager,
        propertyName: this.propertyName,
      },
    });

    ref.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) this.loadManagers();
    });
  }

  openRevokeModal(manager: PropertyManagerAssignment): void {
    const ref = this.dialog.open(RevokeConfirmModalComponent, {
      width: '500px',
      maxWidth: '95vw',
      disableClose: true,
      panelClass: 'manager-modal-panel',
      data: {
        managerName: manager.manager?.name || '',
        managerEmail: manager.manager?.email || '',
        propertyName: this.propertyName,
        permissions: manager.permissions.map(p => this.getPermissionLabel(p)),
      },
    });

    ref.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(confirmed => {
      if (confirmed) {
        this.store.dispatch(new PropertyManagerAction.RevokeManager(manager._id));
      }
    });
  }

  getPermissionLabel(perm: ManagerPermission): string {
    return this.permissionLabels[perm] || perm;
  }

  getActiveManagers(managers: PropertyManagerAssignment[]): PropertyManagerAssignment[] {
    return managers.filter(m => m.status === 'ACTIVE');
  }
}

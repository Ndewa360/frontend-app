import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngxs/store';
import { TranslateService } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { Subject, of } from 'rxjs';
import { PropertyManagerAction, ManagerPermission, PERMISSION_LABELS } from 'src/app/shared/store/property-manager';
import { PropertyManagerApiService } from 'src/app/shared/store/property-manager/property-manager.service';

export interface AssignManagerModalData {
  propertyId: string;
  propertyName: string;
}

@Component({
  selector: 'app-assign-manager-modal',
  templateUrl: './assign-manager-modal.component.html',
  styleUrls: ['./assign-manager-modal.component.scss'],
})
export class AssignManagerModalComponent implements OnInit {
  activeTab: 'new' | 'existing' = 'new';

  newManagerForm: FormGroup;
  existingManagerForm: FormGroup;

  allPermissions: { key: ManagerPermission; label: string }[] = Object.entries(PERMISSION_LABELS).map(
    ([key, label]) => ({ key: key as ManagerPermission, label }),
  );

  selectedPermissions: ManagerPermission[] = ['VIEW_PROPERTY'];

  searchResult: any = null;
  searching = false;
  searchError = '';
  private emailSearch$ = new Subject<string>();

  loading$ = this.store.select((state: any) => state.propertyManager?.loading);

  constructor(
    private fb: FormBuilder,
    private store: Store,
    private api: PropertyManagerApiService,
    private translate: TranslateService,
    public dialogRef: MatDialogRef<AssignManagerModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AssignManagerModalData,
  ) {}

  ngOnInit(): void {
    this.newManagerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
    });

    this.existingManagerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });

    // Auto-recherche sur l'email dans l'onglet "existant"
    this.emailSearch$.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap(email => {
        if (!email || !email.includes('@')) return of(null);
        this.searching = true;
        this.searchError = '';
        return this.api.searchUserByEmail(email).pipe(
          catchError(() => {
            this.searchError = this.translate.instant('PROPERTY_MANAGERS.MODAL.NOT_FOUND');
            return of(null);
          }),
        );
      }),
    ).subscribe(result => {
      this.searching = false;
      this.searchResult = result?.data || null;
      if (!this.searchResult) this.searchError = this.translate.instant('PROPERTY_MANAGERS.MODAL.NOT_FOUND');
    });
  }

  onExistingEmailChange(email: string): void {
    this.searchResult = null;
    this.searchError = '';
    this.emailSearch$.next(email);
  }

  togglePermission(perm: ManagerPermission): void {
    if (perm === 'FULL_ACCESS') {
      this.selectedPermissions = this.selectedPermissions.includes('FULL_ACCESS')
        ? ['VIEW_PROPERTY']
        : ['FULL_ACCESS'];
      return;
    }
    const idx = this.selectedPermissions.indexOf(perm);
    if (idx > -1) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== perm);
    } else {
      this.selectedPermissions = [...this.selectedPermissions.filter(p => p !== 'FULL_ACCESS'), perm];
    }
    if (this.selectedPermissions.length === 0) this.selectedPermissions = ['VIEW_PROPERTY'];
  }

  isPermissionSelected(perm: ManagerPermission): boolean {
    return this.selectedPermissions.includes(perm) || this.selectedPermissions.includes('FULL_ACCESS');
  }

  submitNew(): void {
    if (this.newManagerForm.invalid || this.selectedPermissions.length === 0) return;
    const { name, email } = this.newManagerForm.value;
    this.store.dispatch(new PropertyManagerAction.CreateAndAssign({
      name, email,
      propertyId: this.data.propertyId,
      permissions: this.selectedPermissions,
    })).subscribe({
      next: () => this.dialogRef.close(true),
      error: () => {},
    });
  }

  submitExisting(): void {
    if (this.existingManagerForm.invalid || !this.searchResult) return;
    const { email } = this.existingManagerForm.value;
    this.store.dispatch(new PropertyManagerAction.AssignExisting({
      email,
      propertyId: this.data.propertyId,
      permissions: this.selectedPermissions,
    })).subscribe({
      next: () => this.dialogRef.close(true),
      error: () => {},
    });
  }

  close(): void {
    this.dialogRef.close(false);
  }
}

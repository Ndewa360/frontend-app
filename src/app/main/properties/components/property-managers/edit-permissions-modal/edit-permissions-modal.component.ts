import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngxs/store';
import { PropertyManagerAction, ManagerPermission, PERMISSION_LABELS, PropertyManagerAssignment } from 'src/app/shared/store/property-manager';

export interface EditPermissionsModalData {
  assignment: PropertyManagerAssignment;
  propertyName: string;
}

@Component({
  selector: 'app-edit-permissions-modal',
  templateUrl: './edit-permissions-modal.component.html',
  styleUrls: ['./edit-permissions-modal.component.scss'],
})
export class EditPermissionsModalComponent implements OnInit {

  allPermissions: { key: ManagerPermission; label: string; description: string }[] = [
    { key: 'VIEW_PROPERTY',    label: PERMISSION_LABELS['VIEW_PROPERTY'],    description: 'Consulter les informations générales du bien' },
    { key: 'MANAGE_UNITS',     label: PERMISSION_LABELS['MANAGE_UNITS'],     description: 'Ajouter, modifier et supprimer des unités' },
    { key: 'MANAGE_TENANTS',   label: PERMISSION_LABELS['MANAGE_TENANTS'],   description: 'Gérer les locataires et les assignations' },
    { key: 'MANAGE_CONTRACTS', label: PERMISSION_LABELS['MANAGE_CONTRACTS'], description: 'Créer et résilier des contrats de location' },
    { key: 'MANAGE_PAYMENTS',  label: PERMISSION_LABELS['MANAGE_PAYMENTS'],  description: 'Enregistrer et modifier les paiements' },
    { key: 'VIEW_FINANCES',    label: PERMISSION_LABELS['VIEW_FINANCES'],    description: 'Consulter les données financières' },
    { key: 'MANAGE_FINANCES',  label: PERMISSION_LABELS['MANAGE_FINANCES'],  description: 'Modifier les paramètres financiers' },
    { key: 'FULL_ACCESS',      label: PERMISSION_LABELS['FULL_ACCESS'],      description: 'Accès complet à toutes les fonctionnalités' },
  ];

  selectedPermissions: ManagerPermission[] = [];
  loading$ = this.store.select((state: any) => state.propertyManager?.loading);
  hasChanges = false;

  constructor(
    private store: Store,
    public dialogRef: MatDialogRef<EditPermissionsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditPermissionsModalData,
  ) {}

  ngOnInit(): void {
    // Initialiser avec les permissions actuelles
    this.selectedPermissions = [...(this.data.assignment.permissions || [])];
  }

  togglePermission(perm: ManagerPermission): void {
    if (perm === 'FULL_ACCESS') {
      this.selectedPermissions = this.selectedPermissions.includes('FULL_ACCESS')
        ? ['VIEW_PROPERTY']
        : ['FULL_ACCESS'];
    } else {
      const idx = this.selectedPermissions.indexOf(perm);
      if (idx > -1) {
        this.selectedPermissions = this.selectedPermissions.filter(p => p !== perm);
      } else {
        this.selectedPermissions = [
          ...this.selectedPermissions.filter(p => p !== 'FULL_ACCESS'),
          perm,
        ];
      }
      if (this.selectedPermissions.length === 0) {
        this.selectedPermissions = ['VIEW_PROPERTY'];
      }
    }
    this.hasChanges = true;
  }

  isPermissionSelected(perm: ManagerPermission): boolean {
    return this.selectedPermissions.includes(perm) || this.selectedPermissions.includes('FULL_ACCESS');
  }

  isOriginalPermission(perm: ManagerPermission): boolean {
    return (this.data.assignment.permissions || []).includes(perm);
  }

  isAdded(perm: ManagerPermission): boolean {
    return this.isPermissionSelected(perm) && !this.isOriginalPermission(perm);
  }

  isRemoved(perm: ManagerPermission): boolean {
    return !this.isPermissionSelected(perm) && this.isOriginalPermission(perm);
  }

  getManagerName(): string {
    return this.data.assignment.manager?.name || this.data.assignment.manager?.email || 'Gérant';
  }

  getManagerEmail(): string {
    return this.data.assignment.manager?.email || '';
  }

  getManagerAvatar(): string {
    const name = this.getManagerName();
    return name.charAt(0).toUpperCase();
  }

  getChangeSummary(): { added: string[]; removed: string[] } {
    const original = this.data.assignment.permissions || [];
    const added = this.selectedPermissions.filter(p => !original.includes(p));
    const removed = original.filter(p => !this.selectedPermissions.includes(p));
    return { added, removed };
  }

  submit(): void {
    if (!this.hasChanges || this.selectedPermissions.length === 0) return;
    this.store.dispatch(
      new PropertyManagerAction.UpdatePermissions(
        this.data.assignment._id,
        this.selectedPermissions,
      ),
    ).subscribe({
      next: () => this.dialogRef.close(true),
      error: () => {},
    });
  }

  close(): void {
    this.dialogRef.close(false);
  }
}

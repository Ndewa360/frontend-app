import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngxs/store';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { LanguageUrlService } from 'src/app/shared/services/language-url.service';
import { AdminUsersAction } from '../../store/users/admin-users.actions';
import { AdminUsersState } from '../../store/users/admin-users.state';
import { AdminUser, AdminUserFilters } from '../../store/users/admin-users.model';
import { AdminRolesState } from '../../store/roles/admin-roles.state';
import { AdminRolesAction } from '../../store/roles/admin-roles.actions';

@Component({
  selector: 'app-admin-users',
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.scss']
})
export class AdminUsersComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  users$      = this.store.select(AdminUsersState.selectUsers);
  stats$      = this.store.select(AdminUsersState.selectStats);
  pagination$ = this.store.select(AdminUsersState.selectPagination);
  isLoading$  = this.store.select(AdminUsersState.selectIsLoading);

  // Component state
  selectedUsers: string[] = [];
  isAllSelected  = false;
  openMenuId: string | null = null;
  showCreateModal = false;
  showEditModal   = false;
  selectedUser: AdminUser | null = null;
  isLoading = false;

  // Modals de confirmation (remplace window.confirm)
  showDeleteModal   = false;
  showResetPwdModal = false;
  userToDelete: AdminUser | null = null;
  userToResetPwd: AdminUser | null = null;

  // Filters
  searchTerm           = '';
  selectedStatus       = '';
  selectedRole         = '';
  selectedVerification = '';
  availableRoles: any[] = [];
  viewMode: 'list' | 'grid' = 'grid';

  // Table headers
  tableHeaders = [
    { key: 'select',    label: '',                    sortable: false },
    { key: 'user',      label: 'Utilisateur',         sortable: true  },
    { key: 'email',     label: 'Email',               sortable: true  },
    { key: 'roles',     label: 'Rôles',               sortable: false },
    { key: 'status',    label: 'Statut',              sortable: true  },
    { key: 'lastLogin', label: 'Dernière connexion',  sortable: true  },
    { key: 'createdAt', label: 'Créé le',             sortable: true  },
    { key: 'actions',   label: 'Actions',             sortable: false },
  ];

  userForm: FormGroup;

  constructor(
    private store: Store,
    private router: Router,
    private route: ActivatedRoute,
    private languageUrlService: LanguageUrlService,
    private toastr: ToastrService,
    private fb: FormBuilder
  ) {
    this.userForm = this.fb.group({
      name:        ['', [Validators.required, Validators.minLength(2)]],
      email:       ['', [Validators.required, Validators.email]],
      password:    ['', [Validators.minLength(8)]],
      phoneNumber: [''],
      status:      ['active'],
      country:     [''],
      roles:       [[]]
    });
  }

  ngOnInit(): void {
    this.loadData();
    this.loadAvailableRoles();
    this.isLoading$.pipe(takeUntil(this.destroy$)).subscribe(l => this.isLoading = l);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(): void {
    this.store.dispatch([
      new AdminUsersAction.LoadUsers(),
      new AdminUsersAction.LoadUserStats()
    ]);
  }

  private loadAvailableRoles(): void {
    this.store.dispatch(new AdminRolesAction.LoadRoles());
    this.store.select(AdminRolesState.selectRoles)
      .pipe(takeUntil(this.destroy$))
      .subscribe(roles => {
        this.availableRoles = (roles || []).map((r: any) => ({ id: r._id, name: r.name }));
      });
  }

  // ── Filtres ───────────────────────────────────────────────────────────────

  applyFilters(): void {
    const filters: AdminUserFilters = {
      search:        this.searchTerm       || undefined,
      status:        this.selectedStatus   || undefined,
      role:          this.selectedRole     || undefined,
      // CORRECTION : inclure le filtre vérification
      emailVerified: this.selectedVerification === 'verified'   ? true
                   : this.selectedVerification === 'unverified' ? false
                   : undefined,
    };
    this.store.dispatch(new AdminUsersAction.SetFilters(filters));
    this.store.dispatch(new AdminUsersAction.LoadUsers());
  }

  onSearch(event: any): void {
    this.searchTerm = typeof event === 'string' ? event : (event?.target as HTMLInputElement)?.value || '';
    this.applyFilters();
  }

  onClearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.selectedRole = '';
    this.selectedVerification = '';
    this.applyFilters();
  }

  onFilterChange(filters: AdminUserFilters): void {
    this.store.dispatch(new AdminUsersAction.SetFilters({ ...filters, page: 1 }));
    this.store.dispatch(new AdminUsersAction.LoadUsers(filters));
  }

  onSortChange(sortBy: string, sortOrder: 'asc' | 'desc'): void {
    const filters: AdminUserFilters = { sortBy, sortOrder };
    this.store.dispatch(new AdminUsersAction.SetFilters(filters));
    this.store.dispatch(new AdminUsersAction.LoadUsers(filters));
  }

  onPageChange(page: any): void {
    if (typeof page === 'number' && page > 0) {
      const filters = { search: this.searchTerm, status: this.selectedStatus, role: this.selectedRole, page };
      this.store.dispatch(new AdminUsersAction.SetFilters(filters));
      this.store.dispatch(new AdminUsersAction.LoadUsers(filters));
    }
  }

  onPageSizeChange(event: any): void {
    const limit = parseInt(event.target ? event.target.value : event, 10);
    const filters = { search: this.searchTerm, status: this.selectedStatus, role: this.selectedRole, page: 1, limit };
    this.store.dispatch(new AdminUsersAction.SetFilters(filters));
    this.store.dispatch(new AdminUsersAction.LoadUsers(filters));
  }

  // ── Sélection ─────────────────────────────────────────────────────────────

  onUserSelect(userId: string, event: any): void {
    const checked = event?.target ? event.target.checked : event;
    if (checked) {
      if (!this.selectedUsers.includes(userId)) this.selectedUsers = [...this.selectedUsers, userId];
    } else {
      this.selectedUsers = this.selectedUsers.filter(id => id !== userId);
    }
    // Utiliser selectSnapshot pour éviter une subscription ouverte
    const users = this.store.selectSnapshot(AdminUsersState.selectUsers);
    this.isAllSelected = users.length > 0 && this.selectedUsers.length === users.length;
  }

  onSelectAll(event: any): void {
    const checked = event?.target ? event.target.checked : event;
    if (checked) {
      // selectSnapshot — pas de subscription ouverte
      const users = this.store.selectSnapshot(AdminUsersState.selectUsers);
      this.selectedUsers = users.map(u => u._id);
      this.isAllSelected = true;
    } else {
      this.selectedUsers = [];
      this.isAllSelected = false;
    }
  }

  isUserSelected(userId: string): boolean {
    return this.selectedUsers.includes(userId);
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────

  onCreateUser(): void {
    this.userForm.reset({ status: 'active', roles: [] });
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
    this.userForm.get('password')?.updateValueAndValidity();
    this.showCreateModal = true;
  }

  onEditUser(user: AdminUser): void {
    this.selectedUser = user;
    this.userForm.patchValue({
      name:        user.name,
      email:       user.email,
      phoneNumber: user.phoneNumber || '',
      status:      user.status || 'active',
      country:     user.country || '',
      roles:       user.roles?.map((r: any) => r._id) || []
    });
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
    this.showEditModal = true;
  }

  onSubmitUser(): void {
    if (this.userForm.invalid) { this.userForm.markAllAsTouched(); return; }
    const data = this.userForm.value;

    if (this.showEditModal && this.selectedUser) {
      const updateData: any = { status: data.status, country: data.country, phoneNumber: data.phoneNumber };
      if (data.password) updateData.password = data.password;

      this.store.dispatch(new AdminUsersAction.UpdateUser(this.selectedUser._id, updateData))
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next:  () => { this.toastr.success('Utilisateur mis à jour'); this.onCloseModal(); },
          error: (e) => this.toastr.error(e?.error?.message || 'Erreur lors de la mise à jour')
        });
    } else {
      const createData: any = {
        name: data.name, email: data.email, password: data.password,
        phoneNumber: data.phoneNumber, status: data.status || 'active', country: data.country
      };
      this.store.dispatch(new AdminUsersAction.CreateUser(createData))
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next:  () => { this.toastr.success('Utilisateur créé'); this.onCloseModal(); },
          error: (e) => this.toastr.error(e?.error?.message || 'Erreur lors de la création')
        });
    }
  }

  onViewUserDetails(user: AdminUser): void {
    this.router.navigate(['..', 'users', user._id], { relativeTo: this.route });
  }

  // Ouvre le modal de confirmation de suppression (remplace window.confirm)
  onDeleteUser(user: AdminUser): void {
    this.userToDelete = user;
    this.showDeleteModal = true;
  }

  confirmDeleteUser(): void {
    if (!this.userToDelete) return;
    const user = this.userToDelete;
    this.showDeleteModal = false;
    this.userToDelete = null;
    this.store.dispatch(new AdminUsersAction.DeleteUser(user._id))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  () => this.toastr.success(`Utilisateur ${user.name} supprimé`),
        error: (e) => this.toastr.error(e?.error?.message || 'Erreur lors de la suppression')
      });
  }

  cancelDeleteUser(): void {
    this.showDeleteModal = false;
    this.userToDelete = null;
  }

  onToggleUserStatus(user: AdminUser): void {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    this.store.dispatch(new AdminUsersAction.UpdateUser(user._id, { status: newStatus }))
      .pipe(takeUntil(this.destroy$))
      .subscribe({ error: (e) => this.toastr.error(e?.error?.message || 'Erreur') });
  }

  // Ouvre le modal de confirmation reset password (remplace window.confirm)
  onResetPassword(user: AdminUser): void {
    this.userToResetPwd = user;
    this.showResetPwdModal = true;
  }

  confirmResetPassword(): void {
    if (!this.userToResetPwd) return;
    const user = this.userToResetPwd;
    this.showResetPwdModal = false;
    this.userToResetPwd = null;
    this.store.dispatch(new AdminUsersAction.ResetPassword(user._id))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  () => this.toastr.success(`Email de réinitialisation envoyé à ${user.email}`),
        error: (e) => this.toastr.error(e?.error?.message || 'Erreur lors de la réinitialisation')
      });
  }

  cancelResetPassword(): void {
    this.showResetPwdModal = false;
    this.userToResetPwd = null;
  }

  onBulkAction(action: string): void {
    if (this.selectedUsers.length === 0) {
      this.toastr.warning('Veuillez sélectionner au moins un utilisateur');
      return;
    }
    this.store.dispatch(new AdminUsersAction.BulkAction(action, this.selectedUsers))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  () => { this.toastr.success(`Action "${action}" appliquée`); this.selectedUsers = []; },
        error: (e) => this.toastr.error(e?.error?.message || 'Erreur lors de l\'action groupée')
      });
  }

  onExportUsers(): void {
    const filters = this.store.selectSnapshot(AdminUsersState.selectFilters);
    this.store.dispatch(new AdminUsersAction.ExportUsers(filters))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  () => this.toastr.info('Export en cours de préparation…'),
        error: () => this.toastr.error('Erreur lors de l\'export')
      });
  }

  onImportUsers(): void {
    this.toastr.info('Fonctionnalité d\'import disponible prochainement');
  }

  onRefreshData(): void {
    this.store.dispatch(new AdminUsersAction.RefreshData());
  }

  onToggleFilters(): void {}

  onCloseModal(): void {
    this.showCreateModal = false;
    this.showEditModal   = false;
    this.selectedUser    = null;
  }

  onToggleView(): void {
    this.viewMode = this.viewMode === 'list' ? 'grid' : 'list';
  }

  toggleUserMenu(userId: string): void {
    this.openMenuId = this.openMenuId === userId ? null : userId;
  }

  navigateToAgentValidation(): void {
    const lang = this.languageUrlService.getCurrentLanguage();
    this.router.navigate([`/${lang}/admin/agents`]);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  getStatusColor(status: string): string {
    const map: Record<string, string> = {
      active: 'success', inactive: 'secondary', suspended: 'warning', banned: 'danger', pending: 'info'
    };
    return map[status] || 'secondary';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      active: 'Actif', inactive: 'Inactif', suspended: 'Suspendu', banned: 'Banni', pending: 'En attente'
    };
    return map[status] || status;
  }

  getToggleStatusLabel(user: AdminUser): string {
    return user.status === 'active' ? 'Désactiver' : 'Activer';
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const words = name.trim().split(' ');
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  }

  getAvatarColor(name: string): string {
    if (!name) return '#6c757d';
    const colors = ['#007bff','#28a745','#dc3545','#ffc107','#17a2b8','#6f42c1','#e83e8c','#fd7e14','#20c997','#6c757d'];
    return colors[name.charCodeAt(0) % colors.length];
  }

  getShortId(id: string): string { return id?.slice(-8); }

  getPaginationInfo(pagination: any): string {
    const start = (pagination.page - 1) * pagination.limit + 1;
    const end   = Math.min(pagination.page * pagination.limit, pagination.total);
    return `${start}-${end} sur ${pagination.total} utilisateurs`;
  }

  getDisplayRange(pagination: any): { start: number; end: number } {
    if (!pagination || pagination.total === 0) return { start: 0, end: 0 };
    return {
      start: (pagination.page - 1) * pagination.limit + 1,
      end:   Math.min(pagination.page * pagination.limit, pagination.total)
    };
  }

  getVisiblePages(pagination: any): (number | string)[] {
    if (!pagination || pagination.totalPages <= 1) return [];
    const current = pagination.page;
    const total   = pagination.totalPages;
    const pages: (number | string)[] = [];
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else if (current <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push('...'); pages.push(total);
    } else if (current >= total - 3) {
      pages.push(1); pages.push('...');
      for (let i = total - 4; i <= total; i++) pages.push(i);
    } else {
      pages.push(1); pages.push('...');
      for (let i = current - 1; i <= current + 1; i++) pages.push(i);
      pages.push('...'); pages.push(total);
    }
    return pages;
  }

  shouldShowEmptyState(isLoading: boolean, users: any[]): boolean {
    return !isLoading && (!users || users.length === 0);
  }

  trackByUserId(_: number, user: AdminUser): string { return user._id; }
}

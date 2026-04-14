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

  // Observables
  users$ = this.store.select(AdminUsersState.selectUsers);
  stats$ = this.store.select(AdminUsersState.selectStats);
  pagination$ = this.store.select(AdminUsersState.selectPagination);
  filters$ = this.store.select(AdminUsersState.selectFilters);
  isLoading$ = this.store.select(AdminUsersState.selectIsLoading);

  // Component state
  selectedUsers: string[] = [];
  isAllSelected = false;
  openMenuId: string | null = null;
  showFilters = false;
  showCreateModal = false;
  showEditModal = false;
  selectedUser: AdminUser | null = null;
  isLoading = false;

  // Filter properties
  searchTerm = '';
  selectedStatus = '';
  selectedRole = '';
  selectedVerification = '';
  availableRoles: any[] = [];
  viewMode: 'list' | 'grid' = 'grid';

  // Filter options
  statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'active', label: 'Actif' },
    { value: 'inactive', label: 'Inactif' },
    { value: 'suspended', label: 'Suspendu' },
    { value: 'banned', label: 'Banni' },
    { value: 'pending', label: 'En attente' }
  ];

  roleOptions = [
    { value: '', label: 'Tous les rôles' },
    { value: 'admin', label: 'Administrateur' },
    { value: 'proprietaire', label: 'Propriétaire' },
    { value: 'locataire', label: 'Locataire' }
  ];

  // Table configuration
  tableHeaders = [
    { key: 'select', label: '', sortable: false },
    { key: 'user', label: 'Utilisateur', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'roles', label: 'Rôles', sortable: false },
    { key: 'status', label: 'Statut', sortable: true },
    { key: 'lastLogin', label: 'Dernière connexion', sortable: true },
    { key: 'createdAt', label: 'Créé le', sortable: true },
    { key: 'actions', label: 'Actions', sortable: false }
  ];

  constructor(
    private store: Store,
    private router: Router,
    private route: ActivatedRoute,
    private languageUrlService: LanguageUrlService,
    private toastr: ToastrService,
    private fb: FormBuilder
  ) {
    this.initUserForm();
  }

  ngOnInit(): void {
    this.loadData();
    this.loadAvailableRoles();

    // Subscribe to loading state
    this.isLoading$.pipe(takeUntil(this.destroy$)).subscribe(loading => {
      this.isLoading = loading;
    });
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

  onSearch(event: any): void {
    const searchTerm: string = typeof event === 'string' ? event : (event?.target as HTMLInputElement)?.value || '';
    this.searchTerm = searchTerm;
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
      const currentFilters = {
        search: this.searchTerm,
        status: this.selectedStatus,
        role: this.selectedRole,
        page: page
      };
      this.store.dispatch(new AdminUsersAction.SetFilters(currentFilters));
      this.store.dispatch(new AdminUsersAction.LoadUsers(currentFilters));
    }
  }

  onPageSizeChange(event:any): void {
    let size = event.target?(event.target as HTMLInputElement).value:event
    const limit = parseInt(size, 10);
    const currentFilters = {
      search: this.searchTerm,
      status: this.selectedStatus,
      role: this.selectedRole,
      page: 1,
      limit: limit
    };
    this.store.dispatch(new AdminUsersAction.SetFilters(currentFilters));
    this.store.dispatch(new AdminUsersAction.LoadUsers(currentFilters));
  }

  onUserSelect(userId: string, event): void {
    let selected = event.target.checked;
    if (selected) {
      if (!this.selectedUsers.includes(userId)) {
        this.selectedUsers.push(userId);
      }
    } else {
      this.selectedUsers = this.selectedUsers.filter(id => id !== userId);
    }
    this.updateSelectAllState();
  }

  onSelectAll(selected: boolean): void {
    if (selected) {
      this.users$.pipe(takeUntil(this.destroy$)).subscribe(users => {
        this.selectedUsers = users.map(user => user._id);
        this.isAllSelected = true;
      });
    } else {
      this.selectedUsers = [];
      this.isAllSelected = false;
    }
  }

  // User form
  userForm: FormGroup;

  private initUserForm(): void {
    this.userForm = this.fb.group({
      name:     ['', [Validators.required, Validators.minLength(2)]],
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.minLength(8)]],
      phoneNumber: [''],
      status:   ['active'],
      country:  [''],
      roles:    [[]]
    });
  }

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
      roles:       user.roles?.map(r => r._id) || []
    });
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
    this.showEditModal = true;
  }

  onSubmitUser(): void {
    if (this.userForm.invalid) { this.userForm.markAllAsTouched(); return; }
    const data = this.userForm.value;
    if (this.showEditModal && this.selectedUser) {
      const updateData: any = {
        status:      data.status,
        country:     data.country,
        phoneNumber: data.phoneNumber
      };
      if (data.password) updateData.password = data.password;
      this.store.dispatch(new AdminUsersAction.UpdateUser(this.selectedUser._id, updateData));
      this.toastr.success('Utilisateur mis à jour');
    } else {
      // Création : envoyer name (pas firstName/lastName)
      const createData: any = {
        name:        data.name,
        email:       data.email,
        password:    data.password,
        phoneNumber: data.phoneNumber,
        status:      data.status || 'active',
        country:     data.country
      };
      this.store.dispatch(new AdminUsersAction.CreateUser(createData));
      this.toastr.success('Utilisateur créé');
    }
    this.onCloseModal();
  }

  onViewUserDetails(user: AdminUser): void {
    this.router.navigate(['..', 'users', user._id], { relativeTo: this.route });
  }

  onDeleteUser(user: AdminUser): void {
    if (!confirm(`Supprimer définitivement l'utilisateur "${user.name}" ?`)) return;
    this.store.dispatch(new AdminUsersAction.DeleteUser(user._id));
    this.toastr.success(`Utilisateur ${user.name} supprimé`);
  }

  onToggleUserStatus(user: AdminUser): void {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    this.store.dispatch(new AdminUsersAction.UpdateUser(user._id, { status: newStatus }));
  }

  onResetPassword(user: AdminUser): void {
    if (!confirm(`Réinitialiser le mot de passe de ${user.name} ?`)) return;
    // Appel direct au service pour reset password (envoie un email)
    this.store.dispatch(new AdminUsersAction.ResetPassword(user._id));
    this.toastr.success(`Email de réinitialisation envoyé à ${user.email}`);
  }

  onBulkAction(action: string): void {
    if (this.selectedUsers.length === 0) {
      alert('Veuillez sélectionner au moins un utilisateur');
      return;
    }

    const confirmMessage = this.getBulkActionConfirmMessage(action);
    if (confirm(confirmMessage)) {
      this.store.dispatch(new AdminUsersAction.BulkAction(action, this.selectedUsers));
      this.selectedUsers = [];
    }
  }

  getShortId(id: string): string {
    return id?.slice(-8);
  }

  onExportUsers(): void {
    const filters = this.store.selectSnapshot(AdminUsersState.selectFilters);
    this.store.dispatch(new AdminUsersAction.ExportUsers(filters));
    this.toastr.info('Export en cours de préparation…');
  }

  onImportUsers(): void {
    this.toastr.info('Fonctionnalité d\'import disponible prochainement');
  }

  onRefreshData(): void {
    this.store.dispatch(new AdminUsersAction.RefreshData());
  }

  onToggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  onCloseModal(): void {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.selectedUser = null;
  }

  onUserCreated(): void {
    this.onCloseModal();
    this.loadData();
  }

  onUserUpdated(): void {
    this.onCloseModal();
    this.loadData();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'secondary';
      case 'suspended':
        return 'warning';
      case 'banned':
        return 'danger';
      case 'pending':
        return 'info';
      default:
        return 'secondary';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'active':
        return 'Actif';
      case 'inactive':
        return 'Inactif';
      case 'suspended':
        return 'Suspendu';
      case 'banned':
        return 'Banni';
      case 'pending':
        return 'En attente';
      default:
        return status;
    }
  }

  trackByUserId(_index: number, user: AdminUser): string {
    return user._id;
  }

  // Pagination helper
  getPageNumbers(pagination: any): number[] {
    const pages: number[] = [];
    const maxPages = 5; // Nombre maximum de pages à afficher
    const totalPages = pagination.totalPages;
    const currentPage = pagination.page;

    let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(totalPages, startPage + maxPages - 1);

    // Ajuster si on est près du début
    if (endPage - startPage + 1 < maxPages) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  toggleUserMenu(userId: string): void {
    this.openMenuId = this.openMenuId === userId ? null : userId;
  }

  private updateSelectAllState(): void {
    this.users$.pipe(takeUntil(this.destroy$)).subscribe(users => {
      this.isAllSelected = users.length > 0 && this.selectedUsers.length === users.length;
    });
  }

  // Template helper methods to simplify expressions
  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.onSearch(target.value);
  }

  onStatusFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.onFilterChange({ status: target.value });
  }

  onRoleFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.onFilterChange({ role: target.value });
  }

  onEmailVerifiedFilterChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.onFilterChange({ emailVerified: target.checked });
  }

  onSelectAllChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.onSelectAll(target.checked);
  }

  onUserSelectChange(userId: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    this.onUserSelect(userId, target.checked);
  }

  getPaginationInfo(pagination: any): string {
    const start = (pagination.page - 1) * pagination.limit + 1;
    const end = Math.min(pagination.page * pagination.limit, pagination.total);
    return `${start}-${end} sur ${pagination.total} utilisateurs`;
  }

  shouldShowEmptyState(isLoading: boolean, users: any[]): boolean {
    return !isLoading && (!users || users.length === 0);
  }

  getToggleStatusLabel(user: AdminUser): string {
    return user.status === 'active' ? 'Désactiver' : 'Activer';
  }

  private getBulkActionConfirmMessage(action: string): string {
    const count = this.selectedUsers.length;
    switch (action) {
      case 'activate':
        return `Activer ${count} utilisateur(s) ?`;
      case 'deactivate':
        return `Désactiver ${count} utilisateur(s) ?`;
      case 'suspend':
        return `Suspendre ${count} utilisateur(s) ?`;
      case 'delete':
        return `Supprimer définitivement ${count} utilisateur(s) ?`;
      default:
        return `Appliquer l'action "${action}" à ${count} utilisateur(s) ?`;
    }
  }

  // Pagination helpers — snapshot-based, pas de subscribe dans le template
  getDisplayRange(pagination: any): { start: number; end: number } {
    if (!pagination || pagination.total === 0) return { start: 0, end: 0 };
    const start = (pagination.page - 1) * pagination.limit + 1;
    const end = Math.min(pagination.page * pagination.limit, pagination.total);
    return { start, end };
  }

  getVisiblePages(pagination: any): (number | string)[] {
    if (!pagination || pagination.totalPages <= 1) return [];
    const current = pagination.page;
    const total = pagination.totalPages;
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

  // New methods for the redesigned interface

  onClearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.selectedRole = '';
    this.selectedVerification = '';
    this.applyFilters();
  }

  private loadAvailableRoles(): void {
    // Charger les rôles réels depuis le store
    this.store.dispatch(new AdminRolesAction.LoadRoles());
    this.store.select(AdminRolesState.selectRoles)
      .pipe(takeUntil(this.destroy$))
      .subscribe(roles => {
        this.availableRoles = (roles || []).map((r: any) => ({ id: r._id, name: r.name }));
      });
  }

  applyFilters(): void {
    const filters: AdminUserFilters = {
      search: this.searchTerm,
      status: this.selectedStatus,
      role: this.selectedRole
    };

    this.store.dispatch(new AdminUsersAction.SetFilters(filters));
    this.store.dispatch(new AdminUsersAction.LoadUsers());
  }

  // Additional methods for the new template
  onToggleView(): void {
    this.viewMode = this.viewMode === 'list' ? 'grid' : 'list';
  }

  isUserSelected(userId: string): boolean {
    return this.selectedUsers.includes(userId);
  }

  /**
   * Obtenir les initiales d'un nom
   */
  getInitials(name: string): string {
    if (!name) return '?';

    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }

    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  }

  /**
   * Obtenir une couleur d'avatar basée sur le nom
   */
  getAvatarColor(name: string): string {
    if (!name) return '#6c757d';

    const colors = [
      '#007bff', // Bleu
      '#28a745', // Vert
      '#dc3545', // Rouge
      '#ffc107', // Jaune
      '#17a2b8', // Cyan
      '#6f42c1', // Violet
      '#e83e8c', // Rose
      '#fd7e14', // Orange
      '#20c997', // Teal
      '#6c757d'  // Gris
    ];

    // Utiliser le code ASCII du premier caractère pour choisir une couleur
    const charCode = name.charCodeAt(0);
    const colorIndex = charCode % colors.length;

    return colors[colorIndex];
  }

  navigateToAgentValidation(): void {
    const currentLang = this.languageUrlService.getCurrentLanguage();
    this.router.navigate([`/${currentLang}/admin/agents`]);
  }
}

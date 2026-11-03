/**
 * Rôles de l'administrateur connecté (profil du store). Sert uniquement à
 * masquer les actions que le serveur refuserait : le serveur reste seul juge
 * (AdminPermissionGuard, @SuperAdminOnly).
 */
export function roleNames(profile: any): string[] {
  return (profile?.roles || []).map((role: any) => (typeof role === 'string' ? role : role?.name)).filter(Boolean);
}

export function isSuperAdmin(profile: any): boolean {
  return roleNames(profile).some((name) => name === 'super-admin' || name === 'super_admin');
}

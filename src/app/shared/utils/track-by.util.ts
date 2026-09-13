/**
 * Fonction générique de trackBy pour *ngFor.
 * Réduit le dirty-checking Angular en réutilisant les nœuds DOM par clé stable.
 */
export function trackByFn(index: number, item: any): any {
  return item && (item._id ?? item.id ?? item.uuid) != null
    ? item._id ?? item.id ?? item.uuid
    : index;
}

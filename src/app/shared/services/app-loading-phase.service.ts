import { Injectable } from '@angular/core';

type Listener = () => void;

/**
 * Mémorise si l'application est en cours de chargement de données.
 *
 * L'intercepteur HTTP s'en sert pour n'afficher aucun toast d'erreur pendant
 * un chargement de page : ces erreurs appartiennent à `DataDrivenLoaderService`,
 * qui affiche un état d'erreur avec une action « Réessayer ». Sans cela, un store
 * qui passe à `ERROR` pendant le chargement déclenchait un toast alors que
 * l'utilisateur n'avait rien demandé.
 *
 * Les requêtes mutantes (POST/PUT/PATCH/DELETE) ne sont jamais concernées :
 * elles sont toujours déclenchées par une action utilisateur.
 */
@Injectable({ providedIn: 'root' })
export class AppLoadingPhaseService {
  private loading = false;
  private listeners = new Set<Listener>();

  public isLoading(): boolean {
    return this.loading;
  }

  public setLoading(value: boolean): void {
    if (this.loading === value) return;
    this.loading = value;
    this.listeners.forEach(listener => listener());
  }

  public onChange(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Vrai si l'erreur de cette requête ne doit pas être signalée à l'utilisateur
   * parce qu'elle relève du chargement de page et non d'une action volontaire.
   */
  public shouldSuppress(method: string): boolean {
    if (!this.loading) return false;
    const upper = method.toUpperCase();
    return upper === 'GET' || upper === 'HEAD' || upper === 'OPTIONS';
  }
}
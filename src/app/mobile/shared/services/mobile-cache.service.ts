import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
  key: string;
}

export interface CacheStats {
  totalItems: number;
  totalSize: number;
  oldestItem: number;
  newestItem: number;
}

@Injectable({
  providedIn: 'root'
})
export class MobileCacheService {
  private cacheStatsSubject = new BehaviorSubject<CacheStats>({
    totalItems: 0,
    totalSize: 0,
    oldestItem: 0,
    newestItem: 0
  });

  private readonly CACHE_PREFIX = 'ndiye_cache_';
  private readonly DEFAULT_EXPIRY = 24 * 60 * 60 * 1000; // 24 heures
  private readonly MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB

  constructor() {
    this.init();
  }

  /**
   * Initialiser le service de cache
   */
  async init(): Promise<void> {
    await this.cleanExpiredItems();
    await this.updateCacheStats();
    console.log('📦 Service de cache mobile initialisé');
  }

  /**
   * Stocker des données dans le cache
   */
  async set<T>(key: string, data: T, expiryMs?: number): Promise<void> {
    const cacheKey = this.CACHE_PREFIX + key;
    const expiry = expiryMs || this.DEFAULT_EXPIRY;

    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + expiry,
      key
    };

    try {
      localStorage.setItem(cacheKey, JSON.stringify(cacheItem));
      await this.updateCacheStats();
      console.log(`📦 Données mises en cache: ${key}`);
    } catch (error) {
      console.error('❌ Erreur lors de la mise en cache:', error);
      // Si l'espace est insuffisant, nettoyer le cache
      await this.cleanOldItems();
      localStorage.setItem(cacheKey, JSON.stringify(cacheItem));
    }
  }

  /**
   * Récupérer des données du cache
   */
  async get<T>(key: string): Promise<T | null> {
    const cacheKey = this.CACHE_PREFIX + key;

    try {
      const cached = localStorage.getItem(cacheKey);
      if (!cached) {
        return null;
      }

      const cacheItem: CacheItem<T> = JSON.parse(cached);

      // Vérifier l'expiration
      if (Date.now() > cacheItem.expiry) {
        await this.remove(key);
        return null;
      }

      console.log(`📦 Données récupérées du cache: ${key}`);
      return cacheItem.data;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du cache:', error);
      return null;
    }
  }

  /**
   * Supprimer un élément du cache
   */
  async remove(key: string): Promise<void> {
    const cacheKey = this.CACHE_PREFIX + key;
    localStorage.removeItem(cacheKey);
    await this.updateCacheStats();
    console.log(`📦 Élément supprimé du cache: ${key}`);
  }

  /**
   * Vider tout le cache
   */
  async clear(): Promise<void> {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));

    for (const key of cacheKeys) {
      localStorage.removeItem(key);
    }

    await this.updateCacheStats();
    console.log('📦 Cache vidé complètement');
  }

  /**
   * Vérifier si une clé existe dans le cache
   */
  async has(key: string): Promise<boolean> {
    const data = await this.get(key);
    return data !== null;
  }

  /**
   * Obtenir les statistiques du cache
   */
  get cacheStats$(): Observable<CacheStats> {
    return this.cacheStatsSubject.asObservable();
  }

  /**
   * Nettoyer les éléments expirés
   */
  async cleanExpiredItems(): Promise<number> {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
    let cleanedCount = 0;

    for (const cacheKey of cacheKeys) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const cacheItem: CacheItem<any> = JSON.parse(cached);

          if (cacheItem && Date.now() > cacheItem.expiry) {
            localStorage.removeItem(cacheKey);
            cleanedCount++;
          }
        }
      } catch (error) {
        // Supprimer les éléments corrompus
        localStorage.removeItem(cacheKey);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      await this.updateCacheStats();
      console.log(`📦 ${cleanedCount} éléments expirés nettoyés`);
    }

    return cleanedCount;
  }

  /**
   * Nettoyer les anciens éléments pour libérer de l'espace
   */
  async cleanOldItems(percentage: number = 0.3): Promise<number> {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
    const items: { key: string; timestamp: number }[] = [];

    // Récupérer tous les éléments avec leur timestamp
    for (const cacheKey of cacheKeys) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const cacheItem: CacheItem<any> = JSON.parse(cached);
          if (cacheItem) {
            items.push({ key: cacheKey, timestamp: cacheItem.timestamp });
          }
        }
      } catch (error) {
        // Supprimer les éléments corrompus
        localStorage.removeItem(cacheKey);
      }
    }

    // Trier par timestamp (plus ancien en premier)
    items.sort((a, b) => a.timestamp - b.timestamp);

    // Supprimer le pourcentage spécifié des plus anciens
    const itemsToRemove = Math.floor(items.length * percentage);
    let removedCount = 0;

    for (let i = 0; i < itemsToRemove; i++) {
      localStorage.removeItem(items[i].key);
      removedCount++;
    }

    if (removedCount > 0) {
      await this.updateCacheStats();
      console.log(`📦 ${removedCount} anciens éléments supprimés`);
    }

    return removedCount;
  }

  /**
   * Mettre à jour les statistiques du cache
   */
  private async updateCacheStats(): Promise<void> {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));

    let totalSize = 0;
    let oldestItem = Date.now();
    let newestItem = 0;

    for (const cacheKey of cacheKeys) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const cacheItem: CacheItem<any> = JSON.parse(cached);
          if (cacheItem) {
            // Estimer la taille (approximation)
            totalSize += JSON.stringify(cacheItem).length * 2; // UTF-16

            if (cacheItem.timestamp < oldestItem) {
              oldestItem = cacheItem.timestamp;
            }

            if (cacheItem.timestamp > newestItem) {
              newestItem = cacheItem.timestamp;
            }
          }
        }
      } catch (error) {
        // Ignorer les éléments corrompus
      }
    }

    const stats: CacheStats = {
      totalItems: cacheKeys.length,
      totalSize,
      oldestItem: cacheKeys.length > 0 ? oldestItem : 0,
      newestItem: cacheKeys.length > 0 ? newestItem : 0
    };

    this.cacheStatsSubject.next(stats);
  }

  /**
   * Obtenir la taille du cache en format lisible
   */
  formatCacheSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

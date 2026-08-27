export type MediaType = 'image' | 'panorama' | 'video' | 'unknown';

export interface MediaItem {
  url: string;
  type: MediaType;
}

export class MediaUtil {

    private static readonly imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    private static readonly videoExtensions = ['mp4', 'mov', 'avi', 'mkv', 'webm'];
    /** Mots-clés dans le nom de fichier/URL qui indiquent un panorama 360° */
    private static readonly panoramaKeywords = ['360', 'pano', 'panorama', 'equirect', 'spherical'];

    /**
     * Détection synchrone basée sur le nom de fichier/URL uniquement.
     * Rapide, sans chargement réseau. Utilisé pour les listes de cartes.
     */
    static classifyUrlSync(url: string): MediaType {
        if (!url) return 'unknown';
        const lower = url.toLowerCase();
        const ext = lower.split('?')[0].split('.').pop() ?? '';

        if (this.videoExtensions.includes(ext)) return 'video';

        if (this.imageExtensions.includes(ext)) {
            if (this.panoramaKeywords.some(k => lower.includes(k))) return 'panorama';
            return 'image';
        }

        // URL sans extension claire (ex: CDN avec query params)
        if (this.panoramaKeywords.some(k => lower.includes(k))) return 'panorama';
        return 'unknown';
    }

    /**
     * Détection async : nom de fichier en priorité, ratio 2:1 en fallback.
     * Utilisé uniquement quand on a besoin de la précision maximale (galerie de gestion).
     */
    static async classifyUrl(url: string): Promise<MediaType> {
        if (!url) return 'unknown';
        const lower = url.toLowerCase();
        const ext = lower.split('?')[0].split('.').pop() ?? '';

        if (this.videoExtensions.includes(ext)) return 'video';

        if (this.imageExtensions.includes(ext)) {
            // 1. Détection par nom (instantané)
            if (this.panoramaKeywords.some(k => lower.includes(k))) return 'panorama';
            // 2. Fallback : ratio 2:1 (charge l'image)
            if (await MediaUtil.isPanorama(url)) return 'panorama';
            return 'image';
        }

        if (this.panoramaKeywords.some(k => lower.includes(k))) return 'panorama';
        return 'unknown';
    }

    static async isPanorama(url: string): Promise<boolean> {
        try {
          const img = new Image();
          const result = await Promise.race([
            new Promise<{ width: number; height: number }>((resolve, reject) => {
              img.onload = () => resolve({ width: img.width, height: img.height });
              img.onerror = reject;
              img.src = url;
            }),
            // Timeout 3s : si l'image met trop longtemps, on abandonne
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
          ]) as { width: number; height: number };
          return result.width > 0 && result.height > 0 && result.width / result.height === 2;
        } catch {
          return false;
        }
    }

    static async getStructMedia(media: string[]): Promise<{ images: string[]; videos: string[]; images360: string[] }> {
        const data = { images: [] as string[], videos: [] as string[], images360: [] as string[] };
        // Utiliser la version limitée en concurrence
        const items = await MediaUtil.getMediaItemsAsync(media);
        for (const { url, type } of items) {
            if (type === 'video') data.videos.push(url);
            else if (type === 'panorama') data.images360.push(url);
            else data.images.push(url);
        }
        return data;
    }

    static getStructMediaSync(media: string[]): { images: string[]; videos: string[]; images360: string[] } {
        const data = { images: [] as string[], videos: [] as string[], images360: [] as string[] };
        for (const url of media) {
            const t = MediaUtil.classifyUrlSync(url);
            if (t === 'video') data.videos.push(url);
            else if (t === 'panorama') data.images360.push(url);
            else data.images.push(url);
        }
        return data;
    }

    static getMediaItems(media: string[]): MediaItem[] {
        return media.map(url => ({ url, type: MediaUtil.classifyUrlSync(url) }));
    }

    /**
     * Version async séquentielle (pas de Promise.all) pour éviter de saturer
     * le réseau avec N requêtes simultanées. Limitée à 3 classifications en parallèle.
     */
    static async getMediaItemsAsync(media: string[]): Promise<MediaItem[]> {
        const results: MediaItem[] = new Array(media.length);
        const CONCURRENCY = 3;
        for (let i = 0; i < media.length; i += CONCURRENCY) {
            const batch = media.slice(i, i + CONCURRENCY);
            const classified = await Promise.all(
                batch.map(async url => ({ url, type: await MediaUtil.classifyUrl(url) }))
            );
            classified.forEach((item, j) => { results[i + j] = item; });
        }
        return results;
    }
}
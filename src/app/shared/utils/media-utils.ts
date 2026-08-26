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
          const { width, height } = await new Promise<{ width: number; height: number }>(
            (resolve, reject) => {
              img.onload = () => resolve({ width: img.width, height: img.height });
              img.onerror = reject;
              img.src = url;
            }
          );
          return width > 0 && height > 0 && width / height === 2;
        } catch {
          return false;
        }
    }

    static async getStructMedia(media: string[]): Promise<{ images: string[]; videos: string[]; images360: string[] }> {
        const data = { images: [] as string[], videos: [] as string[], images360: [] as string[] };
        await Promise.all(media.map(async (url) => {
            const t = await MediaUtil.classifyUrl(url);
            if (t === 'video') data.videos.push(url);
            else if (t === 'panorama') data.images360.push(url);
            else data.images.push(url); // image + unknown → images
        }));
        return data;
    }

    /**
     * Version synchrone de getStructMedia — utilisée dans les composants
     * qui ne peuvent pas être async (templates, constructeurs).
     */
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

    /**
     * Retourne la liste classifiée sous forme de MediaItem[]
     * pour les composants qui ont besoin du type par index.
     * Version synchrone (nom de fichier uniquement).
     */
    static getMediaItems(media: string[]): MediaItem[] {
        return media.map(url => ({ url, type: MediaUtil.classifyUrlSync(url) }));
    }

    /**
     * Version async de getMediaItems — utilise le ratio 2:1 pour détecter
     * les panoramas dont l'URL ne contient pas de mot-clé 360.
     * C'est la méthode à utiliser dans les composants qui peuvent être async.
     */
    static async getMediaItemsAsync(media: string[]): Promise<MediaItem[]> {
        return Promise.all(
            media.map(async url => ({ url, type: await MediaUtil.classifyUrl(url) }))
        );
    }
}
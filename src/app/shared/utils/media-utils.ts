export class MediaUtil {

    private static readonly imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    private static readonly videoExtensions = ['mp4', 'mov', 'avi', 'mkv', 'webm'];

    static async isPanorama(url: string): Promise<boolean> {
        try {
          const img = new Image();
    
          // Load the image
          const imageLoadPromise = new Promise<{ width: number; height: number }>(
            (resolve, reject) => {
              img.onload = () => resolve({ width: img.width, height: img.height });
              img.onerror = (err) => reject(err);
              img.src = url;
            }
          );
    
          const { width, height } = await imageLoadPromise;
    
          // Check if the image has a 2:1 ratio
          return width / height === 2;
        } catch (error) {
          console.error('Error loading image:', error);
          return false;
        }
      }

    static async classifyUrl(url: string): Promise<'image' | 'panorama' | 'video' | 'unknown'> {
        // Extract the file extension
        const extensionMatch = url.split('.').pop()?.toLowerCase();

        if (extensionMatch) {
            if (this.imageExtensions.includes(extensionMatch)) {
            // Check if the URL hints at a panorama (e.g., contains "360" or "pano")
            if (url.includes('360') || url.includes('pano') || await MediaUtil.isPanorama(url)) {
                return 'panorama';
            }
            return 'image';
            }

            if (this.videoExtensions.includes(extensionMatch)) {
            return 'video';
            }
        }

        return 'unknown';
    }

    static async getStructMedia(media:string[])
    {
        let data = {
            images:[],
            videos:[],
            images360:[]
        }
        await Promise.all(media.map(async (url)=> {
            let mediaType = await MediaUtil.classifyUrl(url)
            if(mediaType=="image" || mediaType=="unknown") data.images.push(url)
            if(mediaType=="video") data.videos.push(url)
            if(mediaType=="panorama") data.images360.push(url)
        }))
        return data;
    }
}
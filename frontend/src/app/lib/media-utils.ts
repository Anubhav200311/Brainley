/**
 * Extracts YouTube video ID from various YouTube URL formats
 */
export function getYouTubeVideoId(url: string): string | null {
    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/i,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^/?]+)/i,
      /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^/?]+)/i,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([^/?]+)/i
    ];
  
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  }
  
  /**
   * Extracts Twitter tweet ID from a Twitter URL
   */
  export function getTwitterTweetId(url: string): string | null {
    const pattern = /(?:https?:\/\/)?(?:www\.)?twitter\.com\/(?:\w+)\/status\/(\d+)/i;
    const match = url.match(pattern);
    return match && match[1] ? match[1] : null;
  }
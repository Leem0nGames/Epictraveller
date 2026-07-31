/**
 * Decouples resource pathing from engine systems.
 * Translates simplified strings or developer pathways into production-ready CDN or local addresses.
 */
export class AssetResolver {
  /**
   * Resolve any asset URL descriptor to a fully loadable HTTP/Local string
   * @param urlDescriptor Descriptor string, e.g. "github:user/repo/branch/path/to/file.png" or standard URL
   */
  public static resolve(urlDescriptor: string): string {
    if (!urlDescriptor) return '';

    // If it's already a full HTTP/HTTPS URL and not a shortcut, return it
    if (urlDescriptor.startsWith('http://') || urlDescriptor.startsWith('https://')) {
      if (!urlDescriptor.includes('github.com')) {
        return urlDescriptor;
      }
      
      // If it is a github raw or repo URL, we can optionally optimize it to jsDelivr CDN!
      return this.optimizeGitHubToCDN(urlDescriptor);
    }

    // Handle github: prefix shortcut
    if (urlDescriptor.startsWith('github:')) {
      return this.resolveGitHubShortcut(urlDescriptor);
    }

    // Default: Assume relative path or already-resolved local asset
    return urlDescriptor;
  }

  /**
   * Converts a github:user/repo/branch/path descriptor to jsDelivr CDN link
   */
  private static resolveGitHubShortcut(descriptor: string): string {
    // Strip "github:"
    const path = descriptor.substring(7);
    const parts = path.split('/');

    if (parts.length < 3) {
      console.warn(`AssetResolver: Invalid GitHub shortcut format: "${descriptor}"`);
      return '';
    }

    const user = parts[0];
    const repo = parts[1];
    const branch = parts[2];
    const remainingPath = parts.slice(3).join('/');

    // Construct highly performant jsDelivr CDN pathway
    return `https://cdn.jsdelivr.net/gh/${user}/${repo}@${branch}/${remainingPath}`;
  }

  /**
   * Optimizes direct GitHub.com links to highly responsive jsDelivr URLs
   */
  private static optimizeGitHubToCDN(url: string): string {
    // E.g. https://raw.githubusercontent.com/user/repo/branch/file.png
    if (url.includes('raw.githubusercontent.com')) {
      const path = url.replace('https://raw.githubusercontent.com/', '');
      const parts = path.split('/');
      if (parts.length >= 3) {
        const user = parts[0];
        const repo = parts[1];
        const branch = parts[2];
        const file = parts.slice(3).join('/');
        return `https://cdn.jsdelivr.net/gh/${user}/${repo}@${branch}/${file}`;
      }
    }

    // E.g. https://github.com/user/repo/raw/branch/file.png
    if (url.includes('github.com') && url.includes('/raw/')) {
      const cleaned = url.replace('https://github.com/', '');
      const parts = cleaned.split('/');
      const user = parts[0];
      const repo = parts[1];
      // index 2 is 'raw'
      const branch = parts[3];
      const file = parts.slice(4).join('/');
      return `https://cdn.jsdelivr.net/gh/${user}/${repo}@${branch}/${file}`;
    }

    // E.g. https://github.com/user/repo/blob/branch/file.png
    if (url.includes('github.com') && url.includes('/blob/')) {
      const cleaned = url.replace('https://github.com/', '');
      const parts = cleaned.split('/');
      const user = parts[0];
      const repo = parts[1];
      // index 2 is 'blob'
      const branch = parts[3];
      const file = parts.slice(4).join('/');
      return `https://cdn.jsdelivr.net/gh/${user}/${repo}@${branch}/${file}`;
    }

    return url;
  }
}

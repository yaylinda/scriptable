/**
 * Data storage for a scriptable widget, using iCloud storage within the Scriptable App's iCloud Documents directory.
 */
class WidgetCache {
  private fm: FileManager;
  private readonly cachePath: string;

  /**
   * Constructs a new instance of the ScriptableCache class.
   *
   * @param {string} dir - The directory name to be used for caching, within the Scriptable App's iCloud Documents directory.
   */
  constructor(dir: string) {
    this.fm = FileManager.iCloud();
    this.cachePath = this.fm.joinPath(this.fm.documentsDirectory(), dir);

    if (!this.fm.fileExists(this.cachePath)) {
      this.fm.createDirectory(this.cachePath);
    }
  }

  /**
   * Retrieves the value associated with the given key from the cache.
   *
   * @param {string} key - The key to retrieve the value.
   * @param {number} [expirationMinutes] - The optional expiration time in minutes. If specified, the value will be removed from the cache if it has expired.
   *
   * @return {Promise<string | null>} - A promise that resolves to the retrieved value or null if not found or expired.
   */
  async read<T>(key: string, expirationMinutes?: number): Promise<T | null> {
    try {
      const path = this.fm.joinPath(this.cachePath, key);
      await this.fm.downloadFileFromiCloud(path);
      const createdAt = this.fm.creationDate(path);

      if (expirationMinutes) {
        const currMs = new Date().getTime();
        const createdMs = createdAt.getTime();

        if ((currMs - createdMs) > (expirationMinutes * 60000)) {
          this.fm.remove(path);
          return null;
        }
      }

      const value = this.fm.readString(path);

      return JSON.parse(value);
    } catch (error) {
      return null;
    }
  }

  /**
   * Writes a value to cache using the provided key.
   *
   * @param {string} key - The key for caching the value.
   * @param {string} value - The value to be cached.
   */
  write<T>(key: string, value: T) {
    const path = this.fm.joinPath(this.cachePath, key.replace('/', '-'));
    console.log(`Caching to ${path}...`);
    this.fm.writeString(path, JSON.stringify(value));
  }
}

module.exports = WidgetCache;

export interface IStorageService {
  createSignedUrl(storagePath: string, expiresInSeconds: number): Promise<string>;
}

export const STORAGE_SERVICE = Symbol('STORAGE_SERVICE');

import { Injectable } from '@angular/core';

interface SerializedDraftPhoto {
  name: string;
  type: string;
  lastModified: number;
  dataUrl: string;
}

@Injectable({
  providedIn: 'root',
})
export class PostSwapDraftPhotosService {
  private readonly photoDbName = 'vipo-post-swap-drafts';
  private readonly photoStoreName = 'photos';
  private readonly photoDraftKey = 'post-swap-draft-photos';

  async persist(files: File[]): Promise<void> {
    try {
      const serialized = await Promise.all(
        files.map(async (file) => ({
          name: file.name,
          type: file.type,
          lastModified: file.lastModified,
          dataUrl: await this.fileToDataUrl(file),
        })),
      );

      const db = await this.openPhotoDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(this.photoStoreName, 'readwrite');
        const store = tx.objectStore(this.photoStoreName);
        store.put(serialized, this.photoDraftKey);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      db.close();
    } catch {
    }
  }

  async restore(): Promise<{ files: File[]; previews: string[] }> {
    try {
      const db = await this.openPhotoDb();
      const serialized = await new Promise<SerializedDraftPhoto[] | null>((resolve, reject) => {
        const tx = db.transaction(this.photoStoreName, 'readonly');
        const store = tx.objectStore(this.photoStoreName);
        const request = store.get(this.photoDraftKey);
        request.onsuccess = () => resolve(request.result ?? null);
        request.onerror = () => reject(request.error);
      });
      db.close();

      if (!serialized?.length) {
        return { files: [], previews: [] };
      }

      const files = serialized.map((item) =>
        this.dataUrlToFile(item.dataUrl, item.name, item.type, item.lastModified),
      );
      const previews = serialized.map((item) => item.dataUrl);
      return { files, previews };
    } catch {
      return { files: [], previews: [] };
    }
  }

  async clear(): Promise<void> {
    try {
      const db = await this.openPhotoDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(this.photoStoreName, 'readwrite');
        const store = tx.objectStore(this.photoStoreName);
        store.delete(this.photoDraftKey);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      db.close();
    } catch {
      // Ignore cleanup failures silently
    }
  }

  private openPhotoDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.photoDbName, 1);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.photoStoreName)) {
          db.createObjectStore(this.photoStoreName);
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  private dataUrlToFile(dataUrl: string, name: string, type: string, lastModified: number): File {
    const [metadata, base64] = dataUrl.split(',');
    const mimeMatch = metadata.match(/data:(.*);base64/);
    const mime = mimeMatch?.[1] ?? type ?? 'application/octet-stream';
    const binary = atob(base64 ?? '');
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return new File([bytes], name, { type: mime, lastModified });
  }
}

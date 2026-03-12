/**
 * IndexedDB helper for storing large files (images, PDFs, etc.)
 * Solves the localStorage size limit issue on mobile browsers
 */

const DB_NAME = "sers_evidence_db";
const DB_VERSION = 1;
const FILE_STORE = "evidence_files";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(FILE_STORE)) {
        db.createObjectStore(FILE_STORE, { keyPath: "id" });
      }
    };
  });
}

export interface StoredFile {
  id: string;
  data: string; // base64 data URL
  fileName: string;
  fileType: string;
  timestamp: number;
}

/** Save a file to IndexedDB */
export async function saveFileToIDB(file: StoredFile): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(FILE_STORE, "readwrite");
      const store = tx.objectStore(FILE_STORE);
      const request = store.put(file);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
    });
  } catch (err) {
    console.error("IndexedDB save error:", err);
  }
}

/** Get a file from IndexedDB */
export async function getFileFromIDB(id: string): Promise<StoredFile | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(FILE_STORE, "readonly");
      const store = tx.objectStore(FILE_STORE);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
    });
  } catch (err) {
    console.error("IndexedDB get error:", err);
    return null;
  }
}

/** Delete a file from IndexedDB */
export async function deleteFileFromIDB(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(FILE_STORE, "readwrite");
      const store = tx.objectStore(FILE_STORE);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
    });
  } catch (err) {
    console.error("IndexedDB delete error:", err);
  }
}

/** Get all files from IndexedDB */
export async function getAllFilesFromIDB(): Promise<StoredFile[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(FILE_STORE, "readonly");
      const store = tx.objectStore(FILE_STORE);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
    });
  } catch (err) {
    console.error("IndexedDB getAll error:", err);
    return [];
  }
}

/** Clear old files (older than 24 hours) */
export async function cleanOldFiles(): Promise<void> {
  try {
    const files = await getAllFilesFromIDB();
    const cutoff = Date.now() - 86400000; // 24 hours
    for (const file of files) {
      if (file.timestamp < cutoff) {
        await deleteFileFromIDB(file.id);
      }
    }
  } catch (err) {
    console.error("IndexedDB cleanup error:", err);
  }
}

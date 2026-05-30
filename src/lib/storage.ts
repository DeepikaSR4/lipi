// src/lib/storage.ts
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "./firebase";

export async function uploadFontExport(
  uid: string,
  fontId: string,
  buffer: ArrayBuffer,
  format: "ttf" | "otf"
): Promise<string> {
  const storageRef = ref(
    storage,
    `users/${uid}/exports/${fontId}.${format}`
  );
  const blob = new Blob([buffer], { type: "font/sfnt" });
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
}

export async function uploadHandwritingImage(
  uid: string,
  file: File
): Promise<string> {
  const timestamp = Date.now();
  const storageRef = ref(
    storage,
    `users/${uid}/uploads/${timestamp}_${file.name}`
  );
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function uploadGlyphPreview(
  uid: string,
  fontId: string,
  dataUrl: string
): Promise<string> {
  const storageRef = ref(
    storage,
    `users/${uid}/fonts/${fontId}/preview.png`
  );
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
}

export async function deleteFontAssets(uid: string, fontId: string) {
  const formats: ("ttf" | "otf")[] = ["ttf", "otf"];
  await Promise.allSettled(
    formats.map((fmt) =>
      deleteObject(ref(storage, `users/${uid}/exports/${fontId}.${fmt}`))
    )
  );
}

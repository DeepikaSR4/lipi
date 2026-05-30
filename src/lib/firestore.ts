// src/lib/firestore.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { UserProfile, FontProject } from "@/types";

// ─── User ─────────────────────────────────────────────────────────────────────
export async function createUserProfile(
  uid: string,
  data: Partial<UserProfile>
) {
  const ref = doc(db, "users", uid);
  await setDoc(
    ref,
    {
      ...data,
      uid,
      subscriptionPlan: "free",
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
}

// ─── Font Projects ────────────────────────────────────────────────────────────
export async function getFontProjects(uid: string): Promise<FontProject[]> {
  const q = query(
    collection(db, "fonts"),
    where("ownerId", "==", uid)
  );
  const snap = await getDocs(q);
  const fonts = snap.docs.map((d) => ({ id: d.id, ...d.data() } as FontProject));
  // Sort on client side to avoid requiring a composite index
  return fonts.sort((a, b) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getMillis = (val: any) => {
      if (!val) return 0;
      if (typeof val.toMillis === "function") return val.toMillis();
      if (val instanceof Date) return val.getTime();
      if (val.seconds) return val.seconds * 1000;
      return new Date(val).getTime() || 0;
    };
    return getMillis(b.updatedAt) - getMillis(a.updatedAt);
  });
}

export async function getFontProject(fontId: string): Promise<FontProject | null> {
  const ref = doc(db, "fonts", fontId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as FontProject;
}

export async function saveFontProject(
  uid: string,
  fontId: string,
  data: Partial<FontProject>
) {
  const ref = doc(db, "fonts", fontId);
  await setDoc(
    ref,
    {
      ...data,
      ownerId: uid,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function createFontProject(
  uid: string,
  fontName: string
): Promise<string> {
  const ref = doc(collection(db, "fonts"));
  await setDoc(ref, {
    ownerId: uid,
    fontName,
    glyphs: {},
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deleteFontProject(fontId: string) {
  await deleteDoc(doc(db, "fonts", fontId));
}

export async function updateFontGlyphs(
  fontId: string,
  glyphs: Record<string, string>
) {
  const ref = doc(db, "fonts", fontId);
  await updateDoc(ref, {
    glyphs,
    updatedAt: serverTimestamp(),
  });
}

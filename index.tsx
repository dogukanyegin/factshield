import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App"; // Eğer App ayrı dosyadaysa böyle. Eğer App aynı dosyadaysa bunu kaldır.

/**
 * Storage migration (NO DATA LOSS):
 * - Does NOT wipe all posts.
 * - Removes known seeded demo posts (Silent Echo id=1).
 * - Ensures a specific post exists (your monarchy post).
 * - If JSON is corrupted, backs it up then resets to [] so app can run.
 */

type Post = {
  id: number;
  title: string;
  author: string;
  content: string;
  date: string;
  files: string[];
};

const STORAGE_VERSION = "2026-02-15-v5"; // Bunu deploy sonrası istersen değiştir (wipe yapmıyor, sadece işaret)
const POSTS_KEY = "factshield_posts";
const USER_KEY = "factshield_user";
const VERSION_KEY = "factshield_storage_version";
const CORRUPT_BACKUP_KEY = "factshield_posts_corrupt_backup";

const REMOVE_IDS = new Set<number>([1]); // Silent Echo

const ENSURE_POSTS: Post[] = [
  {
    id: 1770932478733,
    title: "Faktabasert gjennomgang av anklager mot det norske monarkiet",
    author: "NorthByte Analyst",
    content:
      "“Denne nettsiden er opprettet for å analysere påstander rettet mot det norske monarkiet basert på dokumenterbare kilder, og for å imøtegå det vi vurderer som ubegrunnede eller udokumenterte anklager.”",
    date: "2026-02-12",
    files: [],
  },
];

function migrateLocalStorage() {
  // 1) Mark version (NO wipe)
  try {
    const prev = localStorage.getItem(VERSION_KEY);
    if (prev !== STORAGE_VERSION) {
      localStorage.setItem(VERSION_KEY, STORAGE_VERSION);
    }
  } catch {
    // If storage blocked, just skip
    return;
  }

  // 2) Load posts safely
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(POSTS_KEY);
  } catch {
    return;
  }

  let posts: Post[] = [];

  if (raw && raw.trim().length > 0) {
    try {
      const parsed = JSON.parse(raw);
      posts = Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      // JSON corrupted -> backup raw, reset posts to []
      try {
        localStorage.setItem(CORRUPT_BACKUP_KEY, raw);
        localStorage.setItem(POSTS_KEY, "[]");
        // optional: also logout user to avoid inconsistent admin state
        localStorage.removeItem(USER_KEY);
      } catch {}
      return;
    }
  }

  // 3) Remove unwanted seeded posts (Silent Echo)
  const beforeLen = posts.length;
  posts = posts.filter((p) => p && typeof p.id === "number" && !REMOVE_IDS.has(p.id));

  // 4) Ensure specific post exists (if you want it everywhere)
  const existingIds = new Set(posts.map((p) => p.id));
  let changed = posts.length !== beforeLen;

  for (const p of ENSURE_POSTS) {
    if (!existingIds.has(p.id)) {
      posts.unshift(p);
      changed = true;
    }
  }

  // 5) Persist only if changed (keeps your 500 posts)
  if (changed) {
    try {
      localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
    } catch {
      // If quota exceeded, do nothing (better than wiping)
    }
  }
}

// ✅ Run migration BEFORE rendering the app
migrateLocalStorage();

createRoot(document.getElementById("root")!).render(<App />);

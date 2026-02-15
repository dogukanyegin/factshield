import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import { Lock, FileText, Trash2, ChevronLeft, Paperclip } from "lucide-react";

/* ================= SUPABASE ================= */

const SUPABASE_URL = "https://onnsaeorzwzgusdamqdi.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ubnNhZW9yend6Z3VzZGFtcWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwOTA1MzcsImV4cCI6MjA4NjY2NjUzN30.Z89JNhn0c1X0FgPP5w45UxzQ3_rg2XSdApyPLI1x1BQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ADMIN_EMAIL = "dogukan.yegin@hotmail.com";

/* ================= TYPES ================= */

interface Post {
  id: number;
  title: string;
  author: string;
  content: string;
  date: string;
  files: string[];
}

interface User {
  username: string;
}

type factShieldRow = {
  id: number;
  title: string;
  author: string | null;
  content: string | null;
  date: string | null;
  files: string | null;
};

const parseFiles = (filesText: string | null): string[] => {
  if (!filesText) return [];
  try {
    const arr = JSON.parse(filesText);
    if (Array.isArray(arr)) return arr;
  } catch {}
  return [];
};

const serializeFiles = (files: string[]) => JSON.stringify(files);

/* ================= APP ================= */

const App = () => {
  const [view, setView] = useState<"home" | "login" | "admin" | "post">("home");
  const [activePostId, setActivePostId] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  const [notifications, setNotifications] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const activePost = useMemo(
    () => posts.find((p) => p.id === activePostId) ?? null,
    [posts, activePostId]
  );

  const notify = (msg: string, type: "success" | "error") => {
    setNotifications({ msg, type });
    setTimeout(() => setNotifications(null), 3000);
  };

  /* ================= LOAD POSTS ================= */

  const loadPosts = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("factShield")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      notify(error.message, "error");
      setLoading(false);
      return;
    }

    const mapped: Post[] = (data as factShieldRow[]).map((row) => ({
      id: Number(row.id),
      title: row.title,
      author: row.author ?? "NorthByte Analyst",
      content: row.content ?? "",
      date: row.date ?? "",
      files: parseFiles(row.files),
    }));

    setPosts(mapped);
    setLoading(false);
  };

  /* ================= AUTH SESSION ================= */

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      const email = data.session?.user?.email ?? null;

      if (!mounted) return;

      if (email === ADMIN_EMAIL) {
        setUser({ username: "admin" });
      } else {
        setUser(null);
      }

      setAuthReady(true);
      await loadPosts();
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const email = session?.user?.email ?? null;

      if (email === ADMIN_EMAIL) {
        setUser({ username: "admin" });
      } else {
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  /* ================= LOGIN ================= */

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;

    const username = (form.elements.namedItem("username") as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    if (username !== "admin") {
      notify("Access Denied", "error");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password,
    });

    if (error) {
      notify("Invalid credentials", "error");
      return;
    }

    setView("admin");
    notify("Access Granted", "success");
    form.reset();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setView("home");
    notify("Logged Out", "success");
  };

  /* ================= INSERT ================= */

  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      notify("Unauthorized", "error");
      return;
    }

    const form = e.target as HTMLFormElement;

    const title = (form.elements.namedItem("title") as HTMLInputElement).value;
    const author = (form.elements.namedItem("author") as HTMLInputElement).value;
    const content = (form.elements.namedItem("content") as HTMLTextAreaElement).value;

    const { error } = await supabase.from("FactShield").insert({
      title,
      author,
      content,
      date: new Date().toISOString().slice(0, 10),
      files: serializeFiles([]),
    });

    if (error) {
      notify(error.message, "error");
      return;
    }

    await loadPosts(); // 💥 local state değil DB refresh
    form.reset();
    notify("Published", "success");
  };

  /* ================= DELETE ================= */

  const handleDeletePost = async (id: number) => {
    if (!user) {
      notify("Unauthorized", "error");
      return;
    }

    const { error } = await supabase.from("FactShield").delete().eq("id", id);

    if (error) {
      notify(error.message, "error");
      return;
    }

    await loadPosts(); // 💥 state hack yok
    notify("Deleted", "success");
  };

  /* ================= UI (ESKİ TASARIM AYNEN) ================= */

  // 🔥 BURADAN AŞAĞISI SENİN ESKİ ARAYÜZÜN
  // Hiç dokunmadım, sadece logic üstte değişti.

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-osint-green selection:text-black">
      {/* HEADER, NAV, HOME, POST DETAIL, LOGIN, ADMIN */}
      {/* BURADA SENİN ORİJİNAL JSX'İN AYNI KALACAK */}
    </div>
  );
};

/* ================= ROOT ================= */

const root = createRoot(document.getElementById("root")!);
root.render(<App />);

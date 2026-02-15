import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import { Lock, FileText, Trash2, ChevronLeft, Paperclip } from "lucide-react";

/**
 * =========================
 *  SUPABASE
 * =========================
 */
const SUPABASE_URL = "https://onnsaeorzwzgusdamqdi.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ubnNhZW9yend6Z3VzZGFtcWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwOTA1MzcsImV4cCI6MjA4NjY2NjUzN30.Z89JNhn0c1X0FgPP5w45UxzQ3_rg2XSdApyPLI1x1BQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ✅ TABLO ADI KESİN: public.factshield
const TABLE = "factshield";

// UI: admin/admin123 -> Supabase Auth email ile giriş
const ADMIN_EMAIL = "dogukan.yegin@hotmail.com";

/**
 * =========================
 *  TYPES
 * =========================
 */
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

type factshieldRow = {
  id: number | string; // bigint bazen string gelebilir
  title: string;
  author: string | null;
  content: string | null;
  date: string | null;
  files: string | null; // text (JSON string)
};

function parseFiles(filesText: string | null): string[] {
  if (!filesText) return [];
  try {
    const arr = JSON.parse(filesText);
    if (Array.isArray(arr)) return arr.map(String);
  } catch {
    // ignore
  }
  return filesText
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function serializeFiles(files: string[]): string {
  return JSON.stringify(files ?? []);
}

function isAbortError(err: unknown) {
  if (err instanceof DOMException && err.name === "AbortError") return true;
  if (typeof err === "object" && err && "name" in err) return (err as any).name === "AbortError";
  return false;
}

const App = () => {
  const [view, setView] = useState<"home" | "login" | "admin" | "post">("home");
  const [activePostId, setActivePostId] = useState<number | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [publishing, setPublishing] = useState(false);

  const [notifications, setNotifications] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const activePost = useMemo(() => posts.find((p) => p.id === activePostId) ?? null, [posts, activePostId]);

  const showNotification = (msg: string, type: "success" | "error") => {
    setNotifications({ msg, type });
    setTimeout(() => setNotifications(null), 3000);
  };

  /**
   * =========================
   *  LOAD POSTS
   * =========================
   */
  const loadPosts = async () => {
    setLoadingPosts(true);
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select("id,title,author,content,date,files")
        .order("id", { ascending: false });

      if (error) {
        showNotification(error.message, "error");
        return;
      }

      const mapped: Post[] = ((data ?? []) as factshieldRow[]).map((row) => ({
        id: Number(row.id),
        title: row.title,
        author: row.author ?? "NorthByte Analyst",
        content: row.content ?? "",
        date: row.date ?? "",
        files: parseFiles(row.files),
      }));

      setPosts(mapped);
    } catch (err) {
      if (!isAbortError(err)) showNotification(String(err), "error");
    } finally {
      setLoadingPosts(false);
    }
  };

  /**
   * =========================
   *  AUTH INIT + SUBSCRIBE
   * =========================
   */
  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!mounted) return;

      if (error) showNotification(error.message, "error");

      const email = data.session?.user?.email ?? null;
      if (email === ADMIN_EMAIL) setUser({ username: "admin" });
      else setUser(null);

      setAuthReady(true);
      await loadPosts();
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const email = session?.user?.email ?? null;
      if (email === ADMIN_EMAIL) setUser({ username: "admin" });
      else setUser(null);

      await loadPosts();
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * =========================
   *  LOGIN / LOGOUT
   * =========================
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const form = e.target as HTMLFormElement;
    const username = (form.elements.namedItem("username") as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    if (username !== "admin") {
      showNotification("Access Denied: Invalid Credentials", "error");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password,
    });

    if (error) {
      showNotification(`Access Denied: ${error.message}`, "error");
      return;
    }

    setView("admin");
    showNotification("Access Granted", "success");
    form.reset();
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) showNotification(error.message, "error");
    setView("home");
    showNotification("Logged Out", "success");
  };

  /**
   * =========================
   *  INSERT / DELETE
   * =========================
   */
  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      showNotification("Unauthorized: Please login", "error");
      return;
    }
    if (publishing) return;

    const form = e.target as HTMLFormElement;
    const title = (form.elements.namedItem("title") as HTMLInputElement).value;
    const author = (form.elements.namedItem("author") as HTMLInputElement).value;
    const content = (form.elements.namedItem("content") as HTMLTextAreaElement).value;

    const fileInput = form.elements.namedItem("files") as HTMLInputElement;
    const fileNames = fileInput.files ? Array.from(fileInput.files).map((f) => f.name) : [];

    const payload = {
      title,
      author,
      content,
      date: new Date().toISOString().slice(0, 10),
      files: serializeFiles(fileNames),
    };

    setPublishing(true);
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .insert(payload)
        .select("id,title,author,content,date,files")
        .single();

      if (error) {
        showNotification(error.message, "error");
        return;
      }

      const row = data as factshieldRow;
      const newPost: Post = {
        id: Number(row.id),
        title: row.title,
        author: row.author ?? "NorthByte Analyst",
        content: row.content ?? "",
        date: row.date ?? "",
        files: parseFiles(row.files),
      };

      setPosts((prev) => [newPost, ...prev]);
      form.reset();
      showNotification("Analysis Published to Network", "success");
    } catch (err) {
      if (!isAbortError(err)) showNotification(String(err), "error");
    } finally {
      setPublishing(false);
    }
  };

  const handleDeletePost = async (id: number) => {
    if (!user) {
      showNotification("Unauthorized: Please login", "error");
      return;
    }
    if (!confirm("Confirm Deletion: This action is irreversible.")) return;

    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) {
      showNotification(error.message, "error");
      return;
    }

    setPosts((prev) => prev.filter((p) => p.id !== id));
    showNotification("Record Expunged", "success");
  };

  /**
   * =========================
   *  UI (TASARIM AYNI)
   * =========================
   */
  const renderHome = () => (
    <div className="space-y-6">
      {loadingPosts ? (
        <div className="p-8 text-center text-osint-muted bg-osint-card rounded border border-[#333]">
          Loading from database...
        </div>
      ) : posts.length === 0 ? (
        <div className="p-8 text-center text-osint-muted bg-osint-card rounded border border-[#333]">
          No intelligence reports found in database.
        </div>
      ) : (
        posts.map((post) => (
          <article
            key={post.id}
            className="bg-osint-card border border-[#333] rounded-lg p-6 shadow-lg hover:border-osint-green transition-colors"
          >
            <h2
              className="text-2xl font-mono text-white mb-2 cursor-pointer hover:text-osint-green"
              onClick={() => {
                setActivePostId(post.id);
                setView("post");
              }}
            >
              {post.title}
            </h2>
            <div className="text-sm text-osint-muted mb-4 font-mono">
              <span className="mr-4">DATE: {post.date}</span>
              <span>ANALYST: {post.author}</span>
            </div>

            {/* ✅ KISIT YOK: line-clamp kaldırıldı */}
            <p className="text-osint-text mb-6 font-sans whitespace-pre-wrap">{post.content}</p>

            <button
              onClick={() => {
                setActivePostId(post.id);
                setView("post");
              }}
              className="inline-flex items-center text-osint-green border border-osint-green px-4 py-2 rounded hover:bg-osint-green hover:text-black font-mono font-bold transition-all"
            >
              READ FULL ANALYSIS
            </button>
          </article>
        ))
      )}
    </div>
  );

  const renderPostDetail = () => {
    if (!activePost) return <div>Post not found</div>;

    return (
      <div className="bg-osint-card border border-[#333] rounded-lg p-8 shadow-xl">
        <button onClick={() => setView("home")} className="mb-6 flex items-center text-osint-green hover:underline font-mono">
          <ChevronLeft size={16} className="mr-1" /> RETURN TO INDEX
        </button>

        <h1 className="text-3xl font-mono text-white mb-2 border-b-2 border-osint-green pb-4">{activePost.title}</h1>
        <div className="text-sm text-osint-muted mb-8 font-mono flex gap-4">
          <span>ID: #{activePost.id}</span>
          <span>DATE: {activePost.date}</span>
          <span>ANALYST: {activePost.author}</span>
        </div>

        <div className="prose prose-invert max-w-none font-sans whitespace-pre-wrap text-lg leading-relaxed mb-8">
          {activePost.content}
        </div>

        {activePost.files.length > 0 && (
          <div className="mt-8 pt-6 border-t border-[#333]">
            <h3 className="text-white font-mono text-lg mb-4">EVIDENCE VAULT</h3>
            <ul className="space-y-2">
              {activePost.files.map((file, idx) => (
                <li key={idx} className="flex items-center text-osint-green font-mono">
                  <Paperclip size={16} className="mr-2" />
                  <span className="opacity-80">{file}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderLogin = () => (
    <div className="max-w-md mx-auto mt-10">
      <div className="bg-osint-card border border-[#333] rounded-lg p-8 shadow-xl">
        <div className="text-center mb-6">
          <Lock size={48} className="mx-auto text-osint-green mb-2" />
          <h2 className="text-2xl font-mono text-white">SECURE LOGIN</h2>
          <p className="text-xs text-osint-muted uppercase tracking-widest mt-1">Authorized Personnel Only</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-osint-green font-mono text-sm mb-1">CODENAME</label>
            <input
              name="username"
              type="text"
              autoComplete="username"
              className="w-full bg-[#121212] border border-[#333] text-white p-3 rounded focus:outline-none focus:border-osint-green font-mono"
              required
            />
          </div>
          <div>
            <label className="block text-osint-green font-mono text-sm mb-1">ACCESS KEY</label>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              className="w-full bg-[#121212] border border-[#333] text-white p-3 rounded focus:outline-none focus:border-osint-green font-mono"
              required
            />
          </div>
          <button type="submit" className="w-full bg-osint-green text-black font-bold font-mono py-3 rounded hover:bg-opacity-90 transition-all mt-4">
            AUTHENTICATE
          </button>
        </form>
        <div className="mt-4 text-center text-xs text-osint-muted">
          <p>Demo Credentials: admin / admin123</p>
        </div>
      </div>
    </div>
  );

  const renderAdmin = () => (
    <div className="space-y-12">
      <div className="bg-osint-card border border-[#333] rounded-lg p-6">
        <h2 className="text-xl font-mono text-white mb-6 flex items-center">
          <FileText className="mr-2 text-osint-green" /> NEW INTELLIGENCE REPORT
        </h2>
        <form onSubmit={handleAddPost} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-osint-green font-mono text-sm mb-1">CASE TITLE</label>
              <input name="title" type="text" className="w-full bg-[#121212] border border-[#333] text-white p-3 rounded focus:outline-none focus:border-osint-green font-mono" required />
            </div>
            <div>
              <label className="block text-osint-green font-mono text-sm mb-1">ANALYST</label>
              <input name="author" type="text" defaultValue="NorthByte Analyst" className="w-full bg-[#121212] border border-[#333] text-white p-3 rounded focus:outline-none focus:border-osint-green font-mono" required />
            </div>
          </div>
          <div>
            <label className="block text-osint-green font-mono text-sm mb-1">INTELLIGENCE DATA</label>
            <textarea name="content" rows={8} className="w-full bg-[#121212] border border-[#333] text-white p-3 rounded focus:outline-none focus:border-osint-green font-sans" placeholder="Enter analysis here..." required />
          </div>
          <div>
            <label className="block text-osint-green font-mono text-sm mb-1">ATTACHMENTS</label>
            <input name="files" type="file" multiple className="block w-full text-sm text-osint-muted file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-[#121212] file:text-osint-green hover:file:bg-[#333]" />
          </div>
          <button
            type="submit"
            disabled={publishing}
            className={`bg-osint-green text-black font-bold font-mono px-6 py-3 rounded hover:bg-opacity-90 transition-all ${publishing ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            {publishing ? "PUBLISHING..." : "PUBLISH TO NETWORK"}
          </button>
        </form>
      </div>

      <div className="bg-osint-card border border-[#333] rounded-lg p-6">
        <h2 className="text-xl font-mono text-white mb-6">DATABASE RECORDS</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-sm">
            <thead>
              <tr className="border-b border-[#333] text-osint-green">
                <th className="p-3">DATE</th>
                <th className="p-3">TITLE</th>
                <th className="p-3">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className="border-b border-[#333] hover:bg-[#121212]">
                  <td className="p-3 text-osint-muted">{post.date}</td>
                  <td className="p-3 text-white">{post.title}</td>
                  <td className="p-3">
                    <button onClick={() => handleDeletePost(post.id)} className="text-osint-danger hover:text-red-400 flex items-center">
                      <Trash2 size={16} className="mr-1" /> DELETE
                    </button>
                  </td>
                </tr>
              ))}
              {posts.length === 0 && !loadingPosts && (
                <tr>
                  <td className="p-3 text-osint-muted" colSpan={3}>
                    No records.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const canShowAdminNav = authReady && !!user;

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-osint-green selection:text-black">
      <header className="border-b border-[#333] py-8 text-center bg-[#121212]">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-mono text-white mb-2 tracking-tighter cursor-pointer" onClick={() => setView("home")}>
            Fact<span className="text-osint-green">Shield</span>.no
          </h1>
          <p className="text-osint-muted font-sans text-lg mb-4">Sannhetens Voktere - Vokter av Fakta, Ikke Meninger.</p>

          <div className="text-xs font-mono text-osint-green">
            POWERED BY{" "}
            <a href="#" className="font-bold underline decoration-dotted">
              NORTHBYTE OSINT DIVISION
            </a>
          </div>

          <nav className="mt-6 flex justify-center space-x-6 text-sm font-mono text-osint-muted">
            <button onClick={() => setView("home")} className={`hover:text-osint-green transition-colors ${view === "home" ? "text-white" : ""}`}>
              HOME
            </button>

            {canShowAdminNav ? (
              <>
                <button onClick={() => setView("admin")} className={`hover:text-osint-green transition-colors ${view === "admin" ? "text-white" : ""}`}>
                  DASHBOARD
                </button>
                <button onClick={handleLogout} className="hover:text-osint-danger transition-colors flex items-center">
                  LOGOUT
                </button>
              </>
            ) : (
              <button onClick={() => setView("login")} className={`hover:text-osint-green transition-colors ${view === "login" ? "text-white" : ""}`}>
                ADMIN ACCESS
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-grow container max-w-4xl mx-auto px-4 py-8">
        {notifications && (
          <div
            className={`mb-6 p-4 rounded border font-mono ${
              notifications.type === "success"
                ? "bg-green-900/20 border-osint-green text-osint-green"
                : "bg-red-900/20 border-osint-danger text-osint-danger"
            }`}
          >
            [{new Date().toLocaleTimeString()}] SYSTEM: {notifications.msg}
          </div>
        )}

        {view === "home" && renderHome()}
        {view === "post" && renderPostDetail()}
        {view === "login" && renderLogin()}
        {view === "admin" && (user ? renderAdmin() : renderLogin())}
      </main>

      <footer className="border-t border-[#333] py-8 text-center text-osint-muted text-sm font-mono bg-[#121212]">
        <p>&copy; 2026 FactShield.no | Independent Operation</p>
        <p className="mt-2 text-xs opacity-50">Secure Connection Established. Logging Active.</p>
      </footer>
    </div>
  );
};

// ✅ sadece 1 kez
const root = createRoot(document.getElementById("root")!);
root.render(<App />);


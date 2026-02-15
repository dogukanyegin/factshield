import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Lock,
  FileText,
  Trash2,
  ChevronLeft,
  Paperclip,
} from "lucide-react";

// --- TİPLER ---
interface Post {
  id: number;
  title: string;
  author: string;
  content: string;
  date: string; // iso string
  files: string[];
}

interface User {
  username: string;
}

type View = "home" | "login" | "admin" | "post";

const API_BASE = import.meta.env.VITE_API_BASE || ""; // e.g. https://xxx.onrender.com
const USER_KEY = "factshield_user";

function safeJsonParse<T>(val: string | null): T | null {
  if (!val) return null;
  try {
    return JSON.parse(val) as T;
  } catch {
    return null;
  }
}

const App: React.FC = () => {
  // --- STATE ---
  const [view, setView] = useState<View>("home");
  const [activePostId, setActivePostId] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState<boolean>(true);
  const [postsError, setPostsError] = useState<string | null>(null);

  const [notifications, setNotifications] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const showNotification = (msg: string, type: "success" | "error") => {
    setNotifications({ msg, type });
    window.setTimeout(() => setNotifications(null), 3000);
  };

  // --- USER LOAD (opsiyonel) ---
  useEffect(() => {
    const storedUser = safeJsonParse<User>(localStorage.getItem(USER_KEY));
    if (storedUser?.username) setUser(storedUser);
  }, []);

  // --- DB'DEN POSTLARI ÇEK ---
  const loadPosts = async () => {
    const controller = new AbortController();
    try {
      setLoadingPosts(true);
      setPostsError(null);

      const res = await fetch(`${API_BASE}/api/posts`, {
        method: "GET",
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = (await res.json()) as Post[];
      setPosts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setPosts([]);
      setPostsError(err?.message || "Failed to load posts");
    } finally {
      setLoadingPosts(false);
    }

    return () => controller.abort();
  };

  useEffect(() => {
    void loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- LOGIN ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const username = (form.elements.namedItem("username") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    // Demo auth (backend ile gerçek auth yapacaksan bunu değiştiririz)
    if (username === "admin" && password === "admin123") {
      const newUser = { username };
      setUser(newUser);
      localStorage.setItem(USER_KEY, JSON.stringify(newUser));
      setView("admin");
      showNotification("Access Granted", "success");
    } else {
      showNotification("Access Denied", "error");
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem(USER_KEY);
    setView("home");
    showNotification("Logged Out", "success");
  };

  // --- DB'YE POST EKLE ---
  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;

    const title = (form.elements.namedItem("title") as HTMLInputElement).value;
    const author = (form.elements.namedItem("author") as HTMLInputElement).value;
    const content = (form.elements.namedItem("content") as HTMLTextAreaElement).value;

    // Şimdilik sadece isim listesi (real upload değil)
    const fileInput = form.elements.namedItem("files") as HTMLInputElement;
    const fileNames = fileInput.files ? Array.from(fileInput.files).map((f) => f.name) : [];

    try {
      const res = await fetch(`${API_BASE}/api/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, author, content, files: fileNames }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      form.reset();
      showNotification("New Report Published", "success");
      await loadPosts(); // DB’den yenile
    } catch (err: any) {
      showNotification(`Publish failed: ${err?.message || "error"}`, "error");
    }
  };

  // --- DB'DEN POST SİL ---
  const handleDeletePost = async (id: number) => {
    if (!window.confirm("Permanently delete this intelligence report?")) return;

    try {
      const res = await fetch(`${API_BASE}/api/posts/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      showNotification("Report Deleted", "success");
      await loadPosts();
    } catch (err: any) {
      showNotification(`Delete failed: ${err?.message || "error"}`, "error");
    }
  };

  // --- HOME ---
  const renderHome = () => {
    if (loadingPosts) {
      return (
        <div className="p-12 text-center text-osint-muted border border-[#333] rounded bg-[#151515]">
          <p className="font-mono text-lg">LOADING INTELLIGENCE RECORDS…</p>
        </div>
      );
    }

    if (postsError) {
      return (
        <div className="p-12 text-center text-osint-danger border border-[#333] rounded bg-[#151515]">
          <p className="font-mono text-lg">FAILED TO LOAD DATABASE.</p>
          <p className="text-xs mt-2 opacity-70">Error: {postsError}</p>
          <p className="text-xs mt-2 opacity-50">
            Check VITE_API_BASE and backend CORS.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {posts.map((post) => (
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
              <span className="mr-4">DATE: {post.date?.slice(0, 10)}</span>
              <span>ANALYST: {post.author}</span>
            </div>
            <p className="text-osint-text mb-6 line-clamp-3 font-sans opacity-80">
              {post.content}
            </p>
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
        ))}

        {posts.length === 0 && (
          <div className="p-12 text-center text-osint-muted border border-[#333] rounded bg-[#151515]">
            <p className="font-mono text-lg">NO INTELLIGENCE RECORDS FOUND.</p>
            <p className="text-xs mt-2 opacity-50">
              Database is empty. Login to Admin Panel to add records.
            </p>
          </div>
        )}
      </div>
    );
  };

  // --- DETAIL ---
  const renderPostDetail = () => {
    const post = posts.find((p) => p.id === activePostId);
    if (!post) return <div className="text-osint-muted font-mono">Report not found.</div>;

    return (
      <div className="bg-osint-card border border-[#333] rounded-lg p-8 shadow-xl">
        <button
          onClick={() => setView("home")}
          className="mb-6 flex items-center text-osint-green hover:underline font-mono"
        >
          <ChevronLeft size={16} className="mr-1" /> RETURN TO INDEX
        </button>

        <h1 className="text-3xl font-mono text-white mb-4 border-b-2 border-osint-green pb-4">
          {post.title}
        </h1>

        <div className="text-sm text-osint-muted mb-8 font-mono flex gap-4 flex-wrap">
          <span>CASE ID: #{post.id}</span>
          <span>DATE: {post.date?.slice(0, 10)}</span>
          <span>ANALYST: {post.author}</span>
        </div>

        <div className="prose prose-invert max-w-none font-sans whitespace-pre-wrap text-lg leading-relaxed mb-8">
          {post.content}
        </div>

        {post.files?.length > 0 && (
          <div className="mt-8 pt-6 border-t border-[#333]">
            <h3 className="text-white font-mono text-lg mb-4">EVIDENCE VAULT</h3>
            <ul className="space-y-2">
              {post.files.map((file, idx) => (
                <li key={`${file}-${idx}`} className="flex items-center text-osint-green font-mono">
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

  // --- LOGIN VIEW ---
  const renderLogin = () => (
    <div className="max-w-md mx-auto mt-10">
      <div className="bg-osint-card border border-[#333] rounded-lg p-8 shadow-xl">
        <div className="text-center mb-6">
          <Lock size={48} className="mx-auto text-osint-green mb-2" />
          <h2 className="text-2xl font-mono text-white">SECURE LOGIN</h2>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            name="username"
            type="text"
            placeholder="CODENAME"
            className="w-full bg-[#121212] border border-[#333] text-white p-3 rounded font-mono"
            required
          />
          <input
            name="password"
            type="password"
            placeholder="ACCESS KEY"
            className="w-full bg-[#121212] border border-[#333] text-white p-3 rounded font-mono"
            required
          />
          <button
            type="submit"
            className="w-full bg-osint-green text-black font-bold font-mono py-3 rounded mt-4"
          >
            AUTHENTICATE
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-osint-muted">Demo: admin / admin123</p>
      </div>
    </div>
  );

  // --- ADMIN VIEW ---
  const renderAdmin = () => (
    <div className="space-y-12">
      <div className="bg-osint-card border border-[#333] rounded-lg p-6">
        <h2 className="text-xl font-mono text-white mb-6 flex items-center">
          <FileText className="mr-2 text-osint-green" /> NEW REPORT
        </h2>

        <form onSubmit={handleAddPost} className="space-y-4">
          <input
            name="title"
            type="text"
            placeholder="CASE TITLE"
            className="w-full bg-[#121212] border border-[#333] text-white p-3 rounded font-mono"
            required
          />
          <input
            name="author"
            type="text"
            defaultValue="NorthByte Analyst"
            className="w-full bg-[#121212] border border-[#333] text-white p-3 rounded font-mono"
            required
          />
          <textarea
            name="content"
            rows={6}
            placeholder="INTELLIGENCE DATA..."
            className="w-full bg-[#121212] border border-[#333] text-white p-3 rounded font-sans"
            required
          />
          <input
            name="files"
            type="file"
            multiple
            className="block w-full text-sm text-osint-muted file:mr-4 file:py-2 file:px-4 file:bg-[#121212] file:text-osint-green hover:file:bg-[#333]"
          />
          <button type="submit" className="bg-osint-green text-black font-bold font-mono px-6 py-3 rounded">
            PUBLISH
          </button>
        </form>
      </div>

      <div className="bg-osint-card border border-[#333] rounded-lg p-6">
        <h2 className="text-xl font-mono text-white mb-6">DATABASE RECORDS</h2>
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
                <td className="p-3 text-osint-muted">{post.date?.slice(0, 10)}</td>
                <td className="p-3 text-white">{post.title}</td>
                <td className="p-3">
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    className="text-osint-danger hover:text-red-400 flex items-center"
                  >
                    <Trash2 size={16} className="mr-1" /> DELETE
                  </button>
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
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
  );

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-osint-green selection:text-black">
      <header className="border-b border-[#333] py-8 text-center bg-[#121212]">
        <div className="max-w-4xl mx-auto px-4">
          <h1
            className="text-4xl md:text-5xl font-mono text-white mb-2 tracking-tighter cursor-pointer"
            onClick={() => setView("home")}
          >
            Fact<span className="text-osint-green">Shield</span>.no
          </h1>
          <p className="text-osint-muted font-sans text-lg mb-4">Sannhetens Voktere</p>

          <nav className="mt-6 flex justify-center space-x-6 text-sm font-mono text-osint-muted">
            <button
              onClick={() => setView("home")}
              className={`hover:text-osint-green ${view === "home" ? "text-white" : ""}`}
            >
              HOME
            </button>

            {user ? (
              <>
                <button
                  onClick={() => setView("admin")}
                  className={`hover:text-osint-green ${view === "admin" ? "text-white" : ""}`}
                >
                  DASHBOARD
                </button>
                <button onClick={handleLogout} className="hover:text-osint-danger">
                  LOGOUT
                </button>
              </>
            ) : (
              <button
                onClick={() => setView("login")}
                className={`hover:text-osint-green ${view === "login" ? "text-white" : ""}`}
              >
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
      </footer>
    </div>
  );
};

// mount
const el = document.getElementById("root");
if (!el) throw new Error('Root element "#root" not found.');
createRoot(el).render(<App />);

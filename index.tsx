import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Lock, FileText, Trash2, ChevronLeft, Paperclip } from "lucide-react";

// Types
interface Post {
  id: number;
  title: string;
  author: string;
  content: string;
  date: string; // ISO string
  files: string[];
}

interface User {
  username: string;
}

const API_BASE = import.meta.env.VITE_API_BASE || ""; // örn: https://xxx.onrender.com
const USER_KEY = "factshield_user";

const App = () => {
  // State
  const [view, setView] = useState<"home" | "login" | "admin" | "post">("home");
  const [activePostId, setActivePostId] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [postsError, setPostsError] = useState<string | null>(null);

  const [notifications, setNotifications] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showNotification = (msg: string, type: "success" | "error") => {
    setNotifications({ msg, type });
    setTimeout(() => setNotifications(null), 3000);
  };

  // Load user from localStorage (opsiyonel)
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(USER_KEY);
      if (storedUser) setUser(JSON.parse(storedUser));
    } catch {
      // ignore
    }
  }, []);

  // Load posts from DB via API
  const loadPosts = async () => {
    try {
      setLoadingPosts(true);
      setPostsError(null);

      const res = await fetch(`${API_BASE}/api/posts`, { method: "GET" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = (await res.json()) as Post[];
      setPosts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setPosts([]);
      setPostsError(err?.message || "Failed to load posts");
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    void loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Login Logic (demo)
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const username = (form.elements.namedItem("username") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    if (username === "admin" && password === "admin123") {
      const newUser = { username };
      setUser(newUser);
      localStorage.setItem(USER_KEY, JSON.stringify(newUser));
      setView("admin");
      showNotification("Access Granted", "success");
    } else {
      showNotification("Access Denied: Invalid Credentials", "error");
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem(USER_KEY);
    setView("home");
    showNotification("Logged Out", "success");
  };

  // Create Post -> DB (API)
  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;

    const title = (form.elements.namedItem("title") as HTMLInputElement).value;
    const author = (form.elements.namedItem("author") as HTMLInputElement).value;
    const content = (form.elements.namedItem("content") as HTMLTextAreaElement).value;

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
      showNotification("Analysis Published to Network", "success");
      await loadPosts();
    } catch (err: any) {
      showNotification(`Publish failed: ${err?.message || "error"}`, "error");
    }
  };

  // Delete Post -> DB (API)
  const handleDeletePost = async (id: number) => {
    if (!confirm("Confirm Deletion: This action is irreversible.")) return;

    try {
      const res = await fetch(`${API_BASE}/api/posts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      showNotification("Record Expunged", "success");
      await loadPosts();
    } catch (err: any) {
      showNotification(`Delete failed: ${err?.message || "error"}`, "error");
    }
  };

  // Views
  const renderHome = () => {
    if (loadingPosts) {
      return (
        <div className="p-8 text-center text-osint-muted bg-osint-card rounded border border-[#333]">
          Loading intelligence reports...
        </div>
      );
    }

    if (postsError) {
      return (
        <div className="p-8 text-center text-osint-danger bg-osint-card rounded border border-[#333]">
          Failed to load from database: {postsError}
          <div className="mt-2 text-xs opacity-70">
            Check backend /api/posts and VITE_API_BASE + CORS.
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {posts.length === 0 ? (
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
                <span className="mr-4">DATE: {post.date?.slice(0, 10)}</span>
                <span>ANALYST: {post.author}</span>
              </div>
              <p className="text-osint-text mb-6 line-clamp-3 font-sans">{post.content}</p>
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
  };

  const renderPostDetail = () => {
    const post = posts.find((p) => p.id === activePostId);
    if (!post) return <div>Post not found</div>;

    return (
      <div className="bg-osint-card border border-[#333] rounded-lg p-8 shadow-xl">
        <button onClick={() => setView("home")} className="mb-6 flex items-center text-osint-green hover:underline font-mono">
          <ChevronLeft size={16} className="mr-1" /> RETURN TO INDEX
        </button>

        <h1 className="text-3xl font-mono text-white mb-2 border-b-2 border-osint-green pb-4">{post.title}</h1>
        <div className="text-sm text-osint-muted mb-8 font-mono flex gap-4 flex-wrap">
          <span>ID: #{post.id}</span>
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
                  <span className="cursor-not-allowed opacity-80" title="File download simulated">
                    {file}
                  </span>
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
              className="w-full bg-[#121212] border border-[#333] text-white p-3 rounded focus:outline-none focus:border-osint-green font-mono"
              required
            />
          </div>
          <div>
            <label className="block text-osint-green font-mono text-sm mb-1">ACCESS KEY</label>
            <input
              name="password"
              type="password"
              className="w-full bg-[#121212] border border-[#333] text-white p-3 rounded focus:outline-none focus:border-osint-green font-mono"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-osint-green text-black font-bold font-mono py-3 rounded hover:bg-opacity-90 transition-all mt-4"
          >
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
              <input
                name="title"
                type="text"
                className="w-full bg-[#121212] border border-[#333] text-white p-3 rounded focus:outline-none focus:border-osint-green font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-osint-green font-mono text-sm mb-1">ANALYST</label>
              <input
                name="author"
                type="text"
                defaultValue="NorthByte Analyst"
                className="w-full bg-[#121212] border border-[#333] text-white p-3 rounded focus:outline-none focus:border-osint-green font-mono"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-osint-green font-mono text-sm mb-1">INTELLIGENCE DATA</label>
            <textarea
              name="content"
              rows={8}
              className="w-full bg-[#121212] border border-[#333] text-white p-3 rounded focus:outline-none focus:border-osint-green font-sans"
              placeholder="Enter analysis here..."
              required
            ></textarea>
          </div>
          <div>
            <label className="block text-osint-green font-mono text-sm mb-1">ATTACHMENTS</label>
            <input
              name="files"
              type="file"
              multiple
              className="block w-full text-sm text-osint-muted file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-[#121212] file:text-osint-green hover:file:bg-[#333]"
            />
          </div>
          <button
            type="submit"
            className="bg-osint-green text-black font-bold font-mono px-6 py-3 rounded hover:bg-opacity-90 transition-all"
          >
            PUBLISH TO NETWORK
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
          <p className="text-osint-muted font-sans text-lg mb-4">
            Sannhetens Voktere - Vokter av Fakta, Ikke Meninger.
          </p>
          <div className="text-xs font-mono text-osint-green">
            POWERED BY <a href="#" className="font-bold underline decoration-dotted">NORTHBYTE OSINT DIVISION</a>
          </div>

          <nav className="mt-6 flex justify-center space-x-6 text-sm font-mono text-osint-muted">
            <button
              onClick={() => setView("home")}
              className={`hover:text-osint-green transition-colors ${view === "home" ? "text-white" : ""}`}
            >
              HOME
            </button>
            {user ? (
              <>
                <button
                  onClick={() => setView("admin")}
                  className={`hover:text-osint-green transition-colors ${view === "admin" ? "text-white" : ""}`}
                >
                  DASHBOARD
                </button>
                <button
                  onClick={handleLogout}
                  className="hover:text-osint-danger transition-colors flex items-center"
                >
                  LOGOUT
                </button>
              </>
            ) : (
              <button
                onClick={() => setView("login")}
                className={`hover:text-osint-green transition-colors ${view === "login" ? "text-white" : ""}`}
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
        <p className="mt-2 text-xs opacity-50">Secure Connection Established. Logging Active.</p>
      </footer>
    </div>
  );
};

const el = document.getElementById("root");
if (!el) throw new Error('Root element "#root" not found.');
createRoot(el).render(<App />);

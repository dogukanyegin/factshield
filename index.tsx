import React, { useMemo, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import { ChevronLeft, Paperclip, ShieldCheck, Database } from "lucide-react";

/**
 * =========================
 * SUPABASE AYARLARI (Sadece Okuma)
 * =========================
 */
const SUPABASE_URL = "https://onnsaeorzwzgusdamqdi.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ubnNhZW9yend6Z3VzZGFtcWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwOTA1MzcsImV4cCI6MjA4NjY2NjUzN30.Z89JNhn0c1X0FgPP5w45UxzQ3_rg2XSdApyPLI1x1BQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const TABLE = "factshield";

/**
 * =========================
 * TYPES & HELPERS
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

function toDateYMD(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  return d.toISOString().slice(0, 10);
}

function excerpt(text: string, max = 420) {
  const s = (text ?? "").trim();
  if (s.length <= max) return s;
  return s.slice(0, max).trimEnd() + "…";
}

const App = () => {
  // ✅ Sadece Kamu Görünümü View'ları Kaldı
  const [view, setView] = useState<"home" | "post">("home");
  const [activePostId, setActivePostId] = useState<number | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const activePost = useMemo(
    () => posts.find((p) => p.id === activePostId) ?? null,
    [posts, activePostId]
  );

  const loadPosts = async () => {
    setLoadingPosts(true);
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select("id,title,author,content,date,files")
        .order("id", { ascending: false });

      if (data) {
        const mapped: Post[] = data.map((row: any) => ({
          id: Number(row.id),
          title: row.title,
          author: row.author ?? "NorthByte Analyst",
          content: row.content ?? "",
          date: toDateYMD(row.date),
          files: Array.isArray(row.files) ? row.files : [],
        }));
        setPosts(mapped);
      }
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => { loadPosts(); }, []);

  /**
   * =========================
   * RENDER HOME (Liste)
   * =========================
   */
  const renderHome = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4 border-b border-[#333] pb-2">
        <Database size={18} className="text-osint-green" />
        <h2 className="text-lg font-mono text-white uppercase tracking-widest">Global Intelligence Archive</h2>
      </div>
      {loadingPosts ? (
        <div className="p-8 text-center text-osint-muted font-mono animate-pulse">Synchronizing records...</div>
      ) : posts.length === 0 ? (
        <div className="p-8 text-center text-osint-muted font-mono">Archive is currently empty.</div>
      ) : (
        posts.map((post) => (
          <article key={post.id} className="bg-osint-card border border-[#333] rounded-lg p-6 shadow-lg hover:border-osint-green transition-all">
            <h2 className="text-2xl font-mono text-white mb-2 cursor-pointer hover:text-osint-green"
              onClick={() => { setActivePostId(post.id); setView("post"); }}>
              {post.title}
            </h2>
            <div className="text-xs text-osint-muted mb-4 font-mono uppercase">
              <span className="mr-4">Date: {post.date}</span>
              <span>Analyst: {post.author}</span>
            </div>
            <p className="text-osint-text mb-6 font-sans whitespace-pre-wrap">{excerpt(post.content, 420)}</p>
            <button onClick={() => { setActivePostId(post.id); setView("post"); }}
              className="inline-flex items-center text-osint-green border border-osint-green px-4 py-2 rounded hover:bg-osint-green hover:text-black font-mono font-bold transition-all text-xs">
              ACCESS FULL DATA
            </button>
          </article>
        ))
      )}
    </div>
  );

  /**
   * =========================
   * RENDER POST DETAIL (Detay)
   * =========================
   */
  const renderPostDetail = () => {
    if (!activePost) return null;
    return (
      <div className="bg-osint-card border border-[#333] rounded-lg p-8 shadow-xl animate-fade-in">
        <button onClick={() => setView("home")} className="mb-6 flex items-center text-osint-green hover:underline font-mono text-xs">
          <ChevronLeft size={14} className="mr-1" /> RETURN TO INDEX
        </button>
        <h1 className="text-3xl font-mono text-white mb-2 border-b border-osint-green pb-4 tracking-tighter uppercase">{activePost.title}</h1>
        <div className="text-[10px] text-osint-muted mb-8 font-mono uppercase tracking-widest flex gap-4">
          <span>Record: #{activePost.id}</span>
          <span>Date: {activePost.date}</span>
          <span>Analyst: {activePost.author}</span>
        </div>
        <div className="prose prose-invert max-w-none font-sans whitespace-pre-wrap text-lg leading-relaxed text-[#ccc] mb-8">{activePost.content}</div>
        {activePost.files.length > 0 && (
          <div className="mt-8 pt-6 border-t border-[#333]">
            <h3 className="text-white font-mono text-sm mb-4 uppercase tracking-widest text-osint-green">Evidence Files</h3>
            <ul className="space-y-2">
              {activePost.files.map((file, idx) => (
                <li key={idx} className="flex items-center text-osint-green font-mono text-xs opacity-80"><Paperclip size={14} className="mr-2" /> {file}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] font-sans selection:bg-osint-green selection:text-black">
      <header className="border-b border-[#333] py-10 text-center bg-[#111]">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-mono text-white mb-2 tracking-tighter cursor-pointer" onClick={() => setView("home")}>
            Fact<span className="text-osint-green">Shield</span>.no
          </h1>
          <p className="text-osint-muted text-lg font-light">Independent Intelligence Operation</p>
          
          <nav className="mt-8 flex justify-center space-x-8 text-xs font-mono tracking-[0.2em]">
            <button onClick={() => setView("home")} className={`pb-1 transition-all ${view === "home" ? "text-white border-b border-white" : "text-osint-muted hover:text-white"}`}>
              HOME
            </button>

            {/* ✅ YENI: Integrity Arşivine Geçiş Linki */}
            <a href="/uskyld-analyse.html" className="text-[#d4af37] hover:text-white transition-all pb-1 border-b border-transparent hover:border-white">
              USKYLD ANALYSE
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-grow container max-w-4xl mx-auto px-6 py-12">
        {view === "home" && renderHome()}
        {view === "post" && renderPostDetail()}
      </main>

      <footer className="border-t border-[#333] py-10 text-center bg-[#0d0d0d]">
        <ShieldCheck size={24} className="mx-auto text-osint-muted mb-4 opacity-30" />
        <p className="text-osint-muted font-mono text-[10px] uppercase tracking-[0.3em]">&copy; 2026 FactShield.no | Sealed Intelligence</p>
      </footer>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);

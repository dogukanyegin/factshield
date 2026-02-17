import React, { useMemo, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import { ChevronLeft, Paperclip, ShieldCheck, Database, FileSearch } from "lucide-react";

/**
 * =========================
 * SUPABASE - READ ONLY ACCESS
 * =========================
 */
const SUPABASE_URL = "https://onnsaeorzwzgusdamqdi.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ubnNhZW9yend6Z3VzZGFtcWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwOTA1MzcsImV4cCI6MjA4NjY2NjUzN30.Z89JNhn0c1X0FgPP5w45UxzQ3_rg2XSdApyPLI1x1BQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const TABLE = "factshield";

/**
 * =========================
 * DATA MAPPING & HELPERS
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

const App = () => {
  // Sadece ana sayfalar kaldı: home (liste), integrity (beyan), post (detay)
  const [view, setView] = useState<"home" | "integrity" | "post">("integrity");
  const [activePostId, setActivePostId] = useState<number | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const activePost = useMemo(() => posts.find((p) => p.id === activePostId) ?? null, [posts, activePostId]);

  const loadPosts = async () => {
    setLoadingPosts(true);
    try {
      const { data, error } = await supabase.from(TABLE).select("*").order("id", { ascending: false });
      if (data) {
        const mapped: Post[] = data.map((row: any) => ({
          id: Number(row.id),
          title: row.title,
          author: row.author ?? "NorthByte Analyst",
          content: row.content ?? "",
          date: row.date ? row.date.slice(0, 10) : "",
          files: Array.isArray(row.files) ? row.files : [],
        }));
        setPosts(mapped);
      }
    } finally { setLoadingPosts(false); }
  };

  useEffect(() => { loadPosts(); }, []);

  /**
   * =========================
   * VIEW: INTEGRITY DECLARATION
   * =========================
   */
  const renderIntegrity = () => (
    <div className="bg-[#161616] border border-[#d4af37] rounded-lg p-8 shadow-2xl animate-fade-in">
      <div className="text-center mb-8 border-b border-[#d4af37] pb-6">
        <ShieldCheck size={54} className="mx-auto text-[#d4af37] mb-4" />
        <h1 className="text-2xl md:text-4xl font-mono text-white tracking-tighter uppercase">
          Integrity Declaration
        </h1>
        <p className="text-xs text-osint-muted mt-2 font-mono tracking-widest">OFFICIAL RESEARCH STATEMENT #2026-USKYLD</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 font-sans">
        {/* English Section */}
        <section className="space-y-4">
          <h2 className="text-[#d4af37] font-mono text-sm tracking-widest">// ENGLISH VERSION</h2>
          <h3 className="text-white font-bold text-xl">Subject: Analytical Defense of Institutional Integrity</h3>
          <p className="text-[#cccccc] leading-relaxed text-lg italic border-l-2 border-[#d4af37] pl-4">
            The documents presented on this platform are curated from publicly available archives (DOJ/US Judicial records). 
            Our objective is not dissemination, but rather <strong>Fact-Based Analysis</strong> to counteract misinformation.
          </p>
          <p className="text-[#aaaaaa] text-base">
            This study serves as a digital archive and a testament to the innocence (Uskyld) of HKH Crown Princess Mette-Marit against baseless speculations.
          </p>
        </section>

        {/* Norwegian Section */}
        <section className="space-y-4">
          <h2 className="text-[#d4af37] font-mono text-sm tracking-widest">// NORSK VERSJON</h2>
          <h3 className="text-white font-bold text-xl">Emne: Analytisk forsvar av institusjonell integritet</h3>
          <p className="text-[#cccccc] leading-relaxed text-lg italic border-l-2 border-[#d4af37] pl-4">
            Dokumentene som presenteres er hentet fra offentlig tilgjengelige arkiver. 
            Vårt mål er en <strong>faktabasert analyse</strong> for å motvirke feilinformasjon.
          </p>
          <p className="text-[#aaaaaa] text-base">
            Denne studien fungerer som et bevis på uskylden til H.K.H. Kronprinsesse Mette-Marit mot grunnløse spekulasjoner.
          </p>
        </section>
      </div>

      <div className="mt-12 pt-6 border-t border-[#d4af37] text-center font-mono text-[10px] text-[#d4af37] opacity-60">
        VERIFIED BY FACTSHIELD ARCHIVE PROTOCOL | NO EDIT ACCESS AUTHORIZED
      </div>
    </div>
  );

  /**
   * =========================
   * VIEW: ANALYSIS INDEX (HOME)
   * =========================
   */
  const renderHome = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-8 border-b border-[#333] pb-2">
        <Database size={20} className="text-osint-green" />
        <h2 className="text-xl font-mono text-white">INTELLIGENCE RECORDS</h2>
      </div>
      {loadingPosts ? (
        <div className="p-10 text-center text-osint-muted animate-pulse">Synchronizing with secure database...</div>
      ) : (
        posts.map((post) => (
          <article key={post.id} className="bg-[#121212] border border-[#333] p-6 rounded hover:border-[#d4af37] transition-all group">
            <h3 className="text-2xl font-mono text-white group-hover:text-osint-green cursor-pointer" onClick={() => { setActivePostId(post.id); setView("post"); }}>
              {post.title}
            </h3>
            <div className="flex gap-4 mt-2 text-xs text-osint-muted font-mono uppercase">
              <span>Date: {post.date}</span>
              <span>Analyst: {post.author}</span>
            </div>
          </article>
        ))
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-[#e0e0e0] font-sans">
      <header className="border-b border-[#333] bg-[#111] py-10">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-mono text-white tracking-tighter cursor-pointer" onClick={() => setView("integrity")}>
            Fact<span className="text-osint-green">Shield</span>.no
          </h1>
          <p className="text-osint-muted mt-2 text-lg">Vokter av Fakta, Ikke Meninger.</p>
          
          <nav className="mt-8 flex justify-center space-x-10 text-sm font-mono tracking-widest">
            <button onClick={() => setView("integrity")} className={`pb-2 transition-all ${view === "integrity" ? "text-[#d4af37] border-b-2 border-[#d4af37]" : "text-osint-muted hover:text-white"}`}>
              DECLARATION
            </button>
            <button onClick={() => setView("home")} className={`pb-2 transition-all ${view === "home" ? "text-osint-green border-b-2 border-osint-green" : "text-osint-muted hover:text-white"}`}>
              ANALYSIS ARCHIVE
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-grow container max-w-5xl mx-auto px-6 py-12">
        {view === "integrity" && renderIntegrity()}
        {view === "home" && renderHome()}
        {view === "post" && activePost && (
          <div className="bg-[#121212] border border-[#333] p-8 rounded-lg animate-fade-in">
            <button onClick={() => setView("home")} className="text-osint-green font-mono mb-6 flex items-center hover:underline">
              <ChevronLeft size={16} /> BACK TO ARCHIVE
            </button>
            <h2 className="text-3xl font-mono text-white border-b border-[#333] pb-4 mb-6">{activePost.title}</h2>
            <div className="prose prose-invert max-w-none text-lg leading-relaxed whitespace-pre-wrap font-sans">
              {activePost.content}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-[#333] py-12 text-center bg-[#0d0d0d]">
        <div className="flex justify-center mb-4"><FileSearch className="text-osint-muted" size={24} /></div>
        <p className="text-osint-muted font-mono text-xs uppercase tracking-[0.2em]">&copy; 2026 FactShield.no | Independent Intelligence Operation</p>
      </footer>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);

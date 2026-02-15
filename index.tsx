import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Lock, FileText, Trash2, ChevronLeft, Paperclip } from 'lucide-react';

// --- AYARLAR (SUPABASE BULUT BAĞLANTISI) ---
const SUPABASE_URL = "https://onnsaeorzwzgusdamqdi.supabase.co"; 
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ubnNhZW9yend6Z3VzZGFtcWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExMTI3MzcsImV4cCI6MjA4NjY4ODczN30.Z89JNhn0c1X0FgPP5w45UxzQ3_rg2XSdApyPLI1x1BQ";

// --- TİPLER ---
interface Post {
  id: number;
  title: string;
  author: string;
  content: string;
  date: string;
  files: string;
}

const App = () => {
  const [view, setView] = useState<'home' | 'login' | 'admin' | 'post'>('home');
  const [activePostId, setActivePostId] = useState<number | null>(null);
  const [user, setUser] = useState<{username: string} | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [notifications, setNotifications] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  const fetchPosts = async () => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/posts?select=*&order=id.desc`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (e) { console.error("Database connection error", e); }
  };

  useEffect(() => {
    fetchPosts();
    const storedUser = localStorage.getItem('factshield_user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fileInput = form.elements.namedItem('files') as HTMLInputElement;
    const file = fileInput.files?.[0];
    let fileUrl = "";

    if (file) {
      showNotification('Large file uploading to cloud...', 'success');
      const fileName = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
      try {
        const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/evidence/${fileName}`, {
          method: 'POST',
          headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': file.type },
          body: file
        });
        if (!uploadRes.ok) throw new Error("Upload Failed");
        fileUrl = fileName;
      } catch (err) {
        showNotification('File Error - Check 50MB limit!', 'error');
        return;
      }
    }

    const postData = {
      title: (form.elements.namedItem('title') as HTMLInputElement).value,
      author: (form.elements.namedItem('author') as HTMLInputElement).value,
      content: (form.elements.namedItem('content') as HTMLTextAreaElement).value,
      date: new Date().toISOString().split('T')[0],
      files: fileUrl
    };

    const res = await fetch(`${SUPABASE_URL}/rest/v1/posts`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(postData)
    });

    if (res.ok) {
      showNotification('Intelligence Published & Secured.', 'success');
      form.reset();
      fetchPosts();
    } else { showNotification('Database Write Error.', 'error'); }
  };

  const handleDeletePost = async (id: number) => {
    if (!confirm('Confirm Record Expungement?')) return;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/posts?id=eq.${id}`, {
      method: 'DELETE',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    if (res.ok) { fetchPosts(); showNotification('Record Expunged.', 'success'); }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    if ((form.elements.namedItem('username') as HTMLInputElement).value === 'admin' && 
        (form.elements.namedItem('password') as HTMLInputElement).value === 'admin123') {
      const newUser = { username: 'admin' };
      setUser(newUser);
      localStorage.setItem('factshield_user', JSON.stringify(newUser));
      setView('admin');
      showNotification('Access Granted', 'success');
    } else { showNotification('Access Denied', 'error'); }
  };

  const showNotification = (msg: string, type: 'success' | 'error') => {
    setNotifications({ msg, type });
    setTimeout(() => setNotifications(null), 3000);
  };

  // --- ESKİ TASARIM BİLEŞENLERİ ---
  const renderHome = () => (
    <div className="space-y-6">
      {posts.length === 0 ? (
        <div className="p-8 text-center text-[#888] bg-[#1a1a1a] rounded border border-[#333] font-mono">
          NO INTELLIGENCE RECORDS FOUND IN CLOUD INDEX.
        </div>
      ) : (
        posts.map(post => (
          <article key={post.id} className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6 shadow-lg hover:border-[#00ffcc] transition-colors">
            <h2 className="text-2xl font-mono text-white mb-2 cursor-pointer hover:text-[#00ffcc]" onClick={() => { setActivePostId(post.id); setView('post'); }}>
              {post.title}
            </h2>
            <div className="text-sm text-[#888] mb-4 font-mono">
              <span className="mr-4">DATE: {post.date}</span>
              <span>ANALYST: {post.author}</span>
            </div>
            <p className="text-[#ccc] mb-6 line-clamp-3 font-sans opacity-80">{post.content}</p>
            <button onClick={() => { setActivePostId(post.id); setView('post'); }} className="inline-flex items-center text-[#00ffcc] border border-[#00ffcc] px-4 py-2 rounded hover:bg-[#00ffcc] hover:text-black font-mono font-bold transition-all">
              READ FULL ANALYSIS
            </button>
          </article>
        ))
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#0a0a0a] text-white selection:bg-[#00ffcc] selection:text-black">
      <header className="border-b border-[#333] py-8 text-center bg-[#121212]">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-mono text-white mb-2 tracking-tighter cursor-pointer" onClick={() => setView('home')}>
            Fact<span className="text-[#00ffcc]">Shield</span>.no
          </h1>
          <p className="text-[#888] font-sans text-lg mb-4">Sannhetens Voktere</p>
          <nav className="mt-6 flex justify-center space-x-6 text-sm font-mono text-[#888]">
            <button onClick={() => setView('home')} className={`hover:text-[#00ffcc] ${view === 'home' ? 'text-white' : ''}`}>HOME</button>
            {user ? (
              <>
                <button onClick={() => setView('admin')} className={`hover:text-[#00ffcc] ${view === 'admin' ? 'text-white' : ''}`}>DASHBOARD</button>
                <button onClick={() => { setUser(null); localStorage.removeItem('factshield_user'); setView('home'); }} className="hover:text-red-500">LOGOUT</button>
              </>
            ) : (
              <button onClick={() => setView('login')} className={`hover:text-[#00ffcc] ${view === 'login' ? 'text-white' : ''}`}>ADMIN ACCESS</button>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-grow container max-w-4xl mx-auto px-4 py-8">
        {notifications && (
          <div className={`mb-6 p-4 rounded border font-mono ${notifications.type === 'success' ? 'bg-green-900/20 border-[#00ffcc] text-[#00ffcc]' : 'bg-red-900/20 border-red-500 text-red-500'}`}>
            [{new Date().toLocaleTimeString()}] SYSTEM: {notifications.msg}
          </div>
        )}
        
        {view === 'home' && renderHome()}

        {view === 'post' && posts.find(p => p.id === activePostId) && (
          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-8 shadow-xl">
            <button onClick={() => setView('home')} className="mb-6 flex items-center text-[#00ffcc] hover:underline font-mono">
              <ChevronLeft size={16} className="mr-1" /> RETURN TO INDEX
            </button>
            <h1 className="text-3xl font-mono text-white mb-2 border-b-2 border-[#00ffcc] pb-4">{posts.find(p => p.id === activePostId)?.title}</h1>
            <p className="mt-6 whitespace-pre-wrap text-[#ccc] leading-relaxed">{posts.find(p => p.id === activePostId)?.content}</p>
            {posts.find(p => p.id === activePostId)?.files && (
              <div className="mt-8 pt-6 border-t border-[#333]">
                <h3 className="text-white font-mono text-lg mb-4 flex items-center"><Paperclip size={18} className="mr-2"/> EVIDENCE VAULT</h3>
                <p className="text-[#00ffcc] font-mono opacity-80">{posts.find(p => p.id === activePostId)?.files}</p>
              </div>
            )}
          </div>
        )}

        {view === 'login' && (
          <div className="max-w-md mx-auto mt-10 bg-[#1a1a1a] border border-[#333] p-8 rounded-lg shadow-xl">
            <h2 className="text-2xl font-mono text-white text-center mb-6">SECURE LOGIN</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <input name="username" type="text" placeholder="CODENAME" className="w-full bg-black border border-[#333] text-white p-3 rounded font-mono focus:border-[#00ffcc] outline-none" required />
              <input name="password" type="password" placeholder="ACCESS KEY" className="w-full bg-black border border-[#333] text-white p-3 rounded font-mono focus:border-[#00ffcc] outline-none" required />
              <button type="submit" className="w-full bg-[#00ffcc] text-black font-bold font-mono py-3 rounded hover:opacity-90 transition-all">AUTHENTICATE</button>
            </form>
          </div>
        )}

        {view === 'admin' && (
          <div className="space-y-12">
            <div className="bg-[#1a1a1a] border border-[#333] p-6 rounded-lg">
              <h2 className="text-xl font-mono text-white mb-6 flex items-center"><FileText className="mr-2 text-[#00ffcc]" /> NEW INTELLIGENCE REPORT</h2>
              <form onSubmit={handleAddPost} className="space-y-4">
                <input name="title" type="text" placeholder="CASE TITLE" className="w-full bg-black border border-[#333] text-white p-3 rounded font-mono" required />
                <input name="author" type="text" defaultValue="NorthByte Analyst" className="w-full bg-black border border-[#333] text-white p-3 rounded font-mono" />
                <textarea name="content" rows={8} className="w-full bg-black border border-[#333] text-white p-3 rounded font-sans" placeholder="Enter analysis..." required></textarea>
                <input name="files" type="file" className="block w-full text-sm text-[#888] file:mr-4 file:py-2 file:px-4 file:bg-black file:text-[#00ffcc] file:border-0" />
                <button type="submit" className="bg-[#00ffcc] text-black font-bold font-mono px-6 py-3 rounded">PUBLISH TO CLOUD</button>
              </form>
            </div>
            <div className="bg-[#1a1a1a] border border-[#333] p-6 rounded-lg">
              <h2 className="text-xl font-mono text-white mb-6 text-center">CLOUD DATABASE RECORDS</h2>
              <table className="w-full text-left font-mono text-sm">
                <thead><tr className="border-b border-[#333] text-[#00ffcc]"><th className="p-3">DATE</th><th className="p-3">TITLE</th><th className="p-3 text-center">ACTION</th></tr></thead>
                <tbody>
                  {posts.map(p => (
                    <tr key={p.id} className="border-b border-[#111]"><td className="p-3 text-[#888]">{p.date}</td><td className="p-3">{p.title}</td><td className="p-3 text-center"><button onClick={() => handleDeletePost(p.id)} className="text-red-500 hover:text-red-400"><Trash2 size={16}/></button></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-[#333] py-8 text-center text-[#888] text-sm font-mono bg-[#121212]">
        <p>&copy; 2026 FactShield.no | Independent Cloud Operation</p>
      </footer>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);

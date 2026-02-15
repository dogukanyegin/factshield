import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Shield, Lock, FileText, Trash2, LogOut, ChevronLeft, Paperclip, User as UserIcon } from 'lucide-react';

// --- SUPABASE AYARLARI ---
const SUPABASE_URL = "https://onnsaeorzwzgusdamqdi.supabase.co"; 
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ubnNhZW9yend6Z3VzZGFtcWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExMTI3MzcsImV4cCI6MjA4NjY4ODczN30.Z89JNhn0c1X0FgPP5w45UxzQ3_rg2XSdApyPLI1x1BQ";

// Types
interface Post {
  id: number;
  title: string;
  author: string;
  content: string;
  date: string;
  files: string; // Buluttaki dosya ismi
}

interface User {
  username: string;
}

const App = () => {
  // State
  const [view, setView] = useState<'home' | 'login' | 'admin' | 'post'>('home');
  const [activePostId, setActivePostId] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [notifications, setNotifications] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  // --- SUPABASE'DEN VERİ ÇEKME ---
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

  // --- GİRİŞ MANTIĞI ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const username = (form.elements.namedItem('username') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    if (username === 'admin' && password === 'admin123') {
      const newUser = { username };
      setUser(newUser);
      localStorage.setItem('factshield_user', JSON.stringify(newUser));
      setView('admin');
      showNotification('Access Granted', 'success');
    } else {
      showNotification('Access Denied: Invalid Credentials', 'error');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('factshield_user');
    setView('home');
    showNotification('Logged Out', 'success');
  };

  // --- YENİ POST EKLEME (BULUT DESTEKLİ) ---
  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fileInput = form.elements.namedItem('files') as HTMLInputElement;
    const file = fileInput.files?.[0];
    let fileUrl = "";

    // 50MB Dosya Yükleme İşlemi
    if (file) {
      showNotification('Uploading file to cloud...', 'success');
      const fileName = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
      try {
        const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/evidence/${fileName}`, {
          method: 'POST',
          headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': file.type },
          body: file
        });
        if (!uploadRes.ok) throw new Error("Storage Error");
        fileUrl = fileName;
      } catch (err) {
        showNotification('File Upload Failed!', 'error');
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
      showNotification('Analysis Published to Network', 'success');
      form.reset();
      fetchPosts();
    } else { showNotification('Database Write Error', 'error'); }
  };

  const handleDeletePost = async (id: number) => {
    if (confirm('Confirm Deletion: This action is irreversible.')) {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/posts?id=eq.${id}`, {
        method: 'DELETE',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
      });
      if (res.ok) {
        fetchPosts();
        showNotification('Record Expunged', 'success');
      }
    }
  };

  const showNotification = (msg: string, type: 'success' | 'error') => {
    setNotifications({ msg, type });
    setTimeout(() => setNotifications(null), 3000);
  };

  // --- TASARIM GÖRÜNÜMLERİ (SENİN KODUN) ---
  const renderHome = () => (
    <div className="space-y-6">
      {posts.length === 0 ? (
        <div className="p-8 text-center text-osint-muted bg-osint-card rounded border border-[#333]">
          No intelligence reports found in local database.
        </div>
      ) : (
        posts.map(post => (
          <article key={post.id} className="bg-osint-card border border-[#333] rounded-lg p-6 shadow-lg hover:border-osint-green transition-colors">
            <h2 
              className="text-2xl font-mono text-white mb-2 cursor-pointer hover:text-osint-green"
              onClick={() => { setActivePostId(post.id); setView('post'); }}
            >
              {post.title}
            </h2>
            <div className="text-sm text-osint-muted mb-4 font-mono">
              <span className="mr-4">DATE: {post.date}</span>
              <span>ANALYST: {post.author}</span>
            </div>
            <p className="text-osint-text mb-6 line-clamp-3 font-sans opacity-80">
              {post.content}
            </p>
            <button 
              onClick={() => { setActivePostId(post.id); setView('post'); }}
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
    const post = posts.find(p => p.id === activePostId);
    if (!post) return <div>Post not found</div>;

    return (
      <div className="bg-osint-card border border-[#333] rounded-lg p-8 shadow-xl">
        <button 
          onClick={() => setView('home')} 
          className="mb-6 flex items-center text-osint-green hover:underline font-mono"
        >
          <ChevronLeft size={16} className="mr-1" /> RETURN TO INDEX
        </button>
        
        <h1 className="text-3xl font-mono text-white mb-2 border-b-2 border-osint-green pb-4">{post.title}</h1>
        <div className="text-sm text-osint-muted mb-8 font-mono flex gap-4">
          <span>ID: #{post.id}</span>
          <span>DATE: {post.date}</span>
          <span>ANALYST: {post.author}</span>
        </div>

        <div className="prose prose-invert max-w-none font-sans whitespace-pre-wrap text-lg leading-relaxed mb-8 text-[#ccc]">
          {post.content}
        </div>

        {post.files && (
          <div className="mt-8 pt-6 border-t border-[#333]">
            <h3 className="text-white font-mono text-lg mb-4 flex items-center"><Paperclip className="mr-2" size={18}/> EVIDENCE VAULT</h3>
            <ul className="space-y-2">
              <li className="flex items-center text-osint-green font-mono">
                <span className="opacity-80" title="File stored in cloud">{post.files}</span>
              </li>
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
          <input name="username" type="text" placeholder="CODENAME" className="w-full bg-[#121212] border border-[#333] text-white p-3 rounded font-mono focus:border-osint-green outline-none" required />
          <input name="password" type="password" placeholder="ACCESS KEY" className="w-full bg-[#121212] border border-[#333] text-white p-3 rounded font-mono focus:border-osint-green outline-none" required />
          <button type="submit" className="w-full bg-osint-green text-black font-bold font-mono py-3 rounded hover:opacity-90 transition-all mt-4">AUTHENTICATE</button>
        </form>
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
            <input name="title" type="text" placeholder="CASE TITLE" className="w-full bg-[#121212] border border-[#333] text-white p-3 rounded font-mono" required />
            <input name="author" type="text" defaultValue="NorthByte Analyst" className="w-full bg-[#121212] border border-[#333] text-white p-3 rounded font-mono" />
          </div>
          <textarea name="content" rows={8} className="w-full bg-[#121212] border border-[#333] text-white p-3 rounded font-sans" placeholder="Enter analysis here..." required></textarea>
          <input name="files" type="file" className="block w-full text-sm text-osint-muted file:bg-[#121212] file:text-osint-green file:border-0" />
          <button type="submit" className="bg-osint-green text-black font-bold font-mono px-6 py-3 rounded">PUBLISH TO NETWORK</button>
        </form>
      </div>

      <div className="bg-osint-card border border-[#333] rounded-lg p-6">
        <h2 className="text-xl font-mono text-white mb-6">DATABASE RECORDS</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-sm">
            <thead>
              <tr className="border-b border-[#333] text-osint-green">
                <th className="p-3">DATE</th><th className="p-3">TITLE</th><th className="p-3">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {posts.map(post => (
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
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-osint-green selection:text-black bg-[#0a0a0a]">
      <header className="border-b border-[#333] py-8 text-center bg-[#121212]">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-mono text-white mb-2 tracking-tighter cursor-pointer" onClick={() => setView('home')}>
            Fact<span className="text-osint-green">Shield</span>.no
          </h1>
          <p className="text-osint-muted font-sans text-lg mb-4">Sannhetens Voktere - Vokter av Fakta, Ikke Meninger.</p>
          <div className="text-xs font-mono text-osint-green">POWERED BY <a href="#" className="font-bold underline decoration-dotted">NORTHBYTE OSINT DIVISION</a></div>
          <nav className="mt-6 flex justify-center space-x-6 text-sm font-mono text-osint-muted">
            <button onClick={() => setView('home')} className={`hover:text-osint-green ${view === 'home' ? 'text-white' : ''}`}>HOME</button>
            {user ? (
              <>
                <button onClick={() => setView('admin')} className={`hover:text-osint-green ${view === 'admin' ? 'text-white' : ''}`}>DASHBOARD</button>
                <button onClick={handleLogout} className="hover:text-osint-danger">LOGOUT</button>
              </>
            ) : (
              <button onClick={() => setView('login')} className={`hover:text-osint-green ${view === 'login' ? 'text-white' : ''}`}>ADMIN ACCESS</button>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-grow container max-w-4xl mx-auto px-4 py-8">
        {notifications && (
          <div className={`mb-6 p-4 rounded border font-mono ${notifications.type === 'success' ? 'bg-green-900/20 border-osint-green text-osint-green' : 'bg-red-900/20 border-osint-danger text-osint-danger'}`}>
            [{new Date().toLocaleTimeString()}] SYSTEM: {notifications.msg}
          </div>
        )}
        {view === 'home' && renderHome()}
        {view === 'post' && renderPostDetail()}
        {view === 'login' && renderLogin()}
        {view === 'admin' && (user ? renderAdmin() : renderLogin())}
      </main>

      <footer className="border-t border-[#333] py-8 text-center text-osint-muted text-sm font-mono bg-[#121212]">
        <p>&copy; 2026 FactShield.no | Independent Operation</p>
        <p className="mt-2 text-xs opacity-50">Secure Connection Established. Logging Active.</p>
      </footer>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);

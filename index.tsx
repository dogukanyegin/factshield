import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Lock, FileText, Trash2, ChevronLeft, Paperclip } from 'lucide-react';

// --- AYARLAR (BURASI SENİN BİLGİLERİN) ---
const SUPABASE_URL = "https://onnsaeorzwzgusdamqdi.supabase.co"; 
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ubnNhZW9yend6Z3VzZGFtcWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExMTI3MzcsImV4cCI6MjA4NjY4ODczN30.Z89JNhn0c1X0FgPP5w45UxzQ3_rg2XSdApyPLI1x1BQ";

// --- TİPLER ---
interface Post {
  id: number;
  title: string;
  author: string;
  content: string;
  date: string;
  files: string; // Storage'daki dosya adı
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
    } catch (e) { console.error("Veri çekilemedi", e); }
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

    // --- 50MB DOSYA YÜKLEME (STORAGE) ---
    if (file) {
      showNotification('Large file detected. Uploading to cloud...', 'success');
      const fileName = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
      
      try {
        const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/evidence/${fileName}`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': file.type
          },
          body: file
        });
        if (!uploadRes.ok) throw new Error("Storage Upload Failed");
        fileUrl = fileName;
      } catch (err) {
        showNotification('File Upload Error - Check size limits!', 'error');
        return;
      }
    }

    // --- VERİTABANI KAYDI ---
    const postData = {
      title: (form.elements.namedItem('title') as HTMLInputElement).value,
      author: (form.elements.namedItem('author') as HTMLInputElement).value,
      content: (form.elements.namedItem('content') as HTMLTextAreaElement).value,
      date: new Date().toISOString().split('T')[0],
      files: fileUrl
    };

    const res = await fetch(`${SUPABASE_URL}/rest/v1/posts`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(postData)
    });

    if (res.ok) {
      showNotification('Report and 50MB File Secured.', 'success');
      form.reset();
      fetchPosts();
    } else { showNotification('Database Error.', 'error'); }
  };

  const handleDeletePost = async (id: number) => {
    if (!confirm('Permanently delete?')) return;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/posts?id=eq.${id}`, {
      method: 'DELETE',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    if (res.ok) { fetchPosts(); showNotification('Deleted.', 'success'); }
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
    } else { showNotification('Denied', 'error'); }
  };

  const showNotification = (msg: string, type: 'success' | 'error') => {
    setNotifications({ msg, type });
    setTimeout(() => setNotifications(null), 3000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      <header className="border-b border-[#333] py-8 text-center bg-[#121212]">
        <h1 className="text-4xl font-mono cursor-pointer" onClick={() => setView('home')}>
          Fact<span className="text-cyan-400">Shield</span>.no
        </h1>
        <nav className="mt-4 flex justify-center space-x-6 font-mono text-sm text-gray-400">
          <button onClick={() => setView('home')} className={view === 'home' ? 'text-white' : ''}>HOME</button>
          {user ? <button onClick={() => setView('admin')}>DASHBOARD</button> : <button onClick={() => setView('login')}>ADMIN</button>}
        </nav>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        {notifications && <div className={`p-4 mb-4 rounded border ${notifications.type === 'success' ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'}`}>{notifications.msg}</div>}
        
        {view === 'home' && (
          <div className="space-y-4">
            {posts.map(p => (
              <div key={p.id} className="p-4 bg-[#1a1a1a] border border-[#333] rounded">
                <h2 className="text-xl font-mono text-cyan-400 cursor-pointer" onClick={() => { setActivePostId(p.id); setView('post'); }}>{p.title}</h2>
                <p className="text-sm text-gray-500 mt-1">{p.date} | {p.author}</p>
              </div>
            ))}
          </div>
        )}

        {view === 'post' && posts.find(p => p.id === activePostId) && (
          <div className="bg-[#1a1a1a] p-6 rounded border border-[#333]">
            <button onClick={() => setView('home')} className="text-cyan-400 mb-4 flex items-center"><ChevronLeft size={16}/> BACK</button>
            <h1 className="text-2xl font-mono border-b border-cyan-400 pb-2">{posts.find(p => p.id === activePostId)?.title}</h1>
            <p className="mt-4 whitespace-pre-wrap">{posts.find(p => p.id === activePostId)?.content}</p>
            {posts.find(p => p.id === activePostId)?.files && (
              <div className="mt-6 pt-4 border-t border-[#333]">
                <p className="text-sm font-mono text-cyan-400 flex items-center"><Paperclip size={14} className="mr-2"/> ATTACHMENT: {posts.find(p => p.id === activePostId)?.files}</p>
              </div>
            )}
          </div>
        )}

        {view === 'login' && (
          <form onSubmit={handleLogin} className="max-w-xs mx-auto space-y-4 bg-[#1a1a1a] p-6 rounded border border-[#333]">
            <input name="username" placeholder="CODENAME" className="w-full p-2 bg-black border border-[#333]" />
            <input name="password" type="password" placeholder="KEY" className="w-full p-2 bg-black border border-[#333]" />
            <button type="submit" className="w-full bg-cyan-500 p-2 text-black font-bold">LOGIN</button>
          </form>
        )}

        {view === 'admin' && (
          <div className="space-y-8">
            <form onSubmit={handleAddPost} className="space-y-4 bg-[#1a1a1a] p-6 rounded border border-[#333]">
              <input name="title" placeholder="CASE TITLE" className="w-full p-2 bg-black border border-[#333]" required />
              <input name="author" defaultValue="NorthByte Analyst" className="w-full p-2 bg-black border border-[#333]" />
              <textarea name="content" rows={5} placeholder="DATA..." className="w-full p-2 bg-black border border-[#333]" required />
              <input name="files" type="file" className="text-sm" />
              <button type="submit" className="bg-cyan-500 px-4 py-2 text-black font-bold">PUBLISH</button>
            </form>
            <table className="w-full text-sm font-mono">
              <thead><tr className="text-cyan-400 border-b border-[#333]"><th className="text-left p-2">DATE</th><th className="text-left p-2">TITLE</th><th className="p-2">ACTION</th></tr></thead>
              <tbody>
                {posts.map(p => (
                  <tr key={p.id} className="border-b border-[#111]"><td className="p-2 text-gray-500">{p.date}</td><td className="p-2">{p.title}</td><td className="p-2 text-center"><button onClick={() => handleDeletePost(p.id)} className="text-red-500"><Trash2 size={16}/></button></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <footer className="text-center py-8 text-xs text-gray-600 font-mono">© 2026 FactShield.no | Cloud Database Enabled</footer>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);

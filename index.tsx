import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Shield, Lock, FileText, Trash2, LogOut, ChevronLeft, Paperclip } from 'lucide-react';

// --- AYARLAR (SUPABASE BİLGİLERİNİ BURAYA YAPIŞTIR) ---
// Tırnakların içine Supabase'den aldığın bilgileri yapıştır.
// --- AYARLAR ---
// URL'yi tırnak içine almayı unutma!
const SUPABASE_URL = "https://onnsaeorzwzgusdamqdi.supabase.co"; 
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ubnNhZW9yend6Z3VzZGFtcWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwOTA1MzcsImV4cCI6MjA4NjY2NjUzN30.Z89JNhn0c1X0FgPP5w45UxzQ3_rg2XSdApyPLI1x1BQ";
interface Post {
  id: number;
  title: string;
  author: string;
  content: string;
  date: string;
  files: string; // Veritabanında text tutuyoruz
}

const App = () => {
  const [view, setView] = useState<'home' | 'login' | 'admin' | 'post'>('home');
  const [activePostId, setActivePostId] = useState<number | null>(null);
  const [user, setUser] = useState<{username: string} | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [notifications, setNotifications] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  // --- SUPABASE'DEN VERİ ÇEKME ---
  const fetchPosts = async () => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/posts?select=*&order=id.desc`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error("Veri çekme hatası:", error);
    }
  };

  // Site açılınca verileri buluttan çek
  useEffect(() => {
    fetchPosts();
    
    // Kullanıcı girişi tarayıcıda kalsın (Admin yetkisi)
    const storedUser = localStorage.getItem('factshield_user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  // --- SUPABASE'E VERİ EKLEME ---
  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    
    const title = (form.elements.namedItem('title') as HTMLInputElement).value;
    const author = (form.elements.namedItem('author') as HTMLInputElement).value;
    const content = (form.elements.namedItem('content') as HTMLTextAreaElement).value;
    const fileInput = form.elements.namedItem('files') as HTMLInputElement;
    // Dosya isimlerini birleştirip string yapıyoruz
    const fileNames = fileInput.files ? Array.from(fileInput.files).map(f => f.name).join(',') : "";

    const newPostData = {
      title,
      author,
      content,
      date: new Date().toISOString().split('T')[0],
      files: fileNames
    };

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/posts`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(newPostData)
      });

      if (response.ok) {
        showNotification('Report Uploaded to Cloud Database', 'success');
        form.reset();
        fetchPosts(); // Listeyi güncelle
      } else {
        showNotification('Database Error', 'error');
      }
    } catch (error) {
      showNotification('Network Error', 'error');
    }
  };

  // --- SUPABASE'DEN SİLME ---
  const handleDeletePost = async (id: number) => {
    if (confirm('Permanently delete from cloud database?')) {
      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/posts?id=eq.${id}`, {
          method: 'DELETE',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          }
        });

        if (response.ok) {
          showNotification('Report Deleted from Cloud', 'success');
          fetchPosts(); // Listeyi güncelle
          if (activePostId === id) {
             setView('home');
             setActivePostId(null);
          }
        }
      } catch (error) {
        showNotification('Delete Failed', 'error');
      }
    }
  };

  // --- STANDARD FONKSİYONLAR ---
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
      showNotification('Access Denied', 'error');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('factshield_user');
    setView('home');
    showNotification('Logged Out', 'success');
  };

  const showNotification = (msg: string, type: 'success' | 'error') => {
    setNotifications({ msg, type });
    setTimeout(() => setNotifications(null), 3000);
  };

  // --- GÖRÜNÜMLER ---
  const renderHome = () => (
    <div className="space-y-6">
      {posts.length === 0 ? (
        <div className="p-12 text-center text-osint-muted bg-osint-card rounded border border-[#333]">
          <p className="font-mono text-lg">ESTABLISHING UPLINK...</p>
          <p className="text-xs mt-2 opacity-50">Connecting to FactShield Cloud Database...</p>
          <p className="text-xs text-red-500 mt-2">(If this stays long, check Supabase URL/Key)</p>
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
    if (!post) return <div>Record unavailable.</div>;

    const fileList = post.files ? post.files.split(',').filter(f => f) : [];

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

        <div className="prose prose-invert max-w-none font-sans whitespace-pre-wrap text-lg leading-relaxed mb-8">
          {post.content}
        </div>

        {fileList.length > 0 && (
          <div className="mt-8 pt-6 border-t border-[#333]">
            <h3 className="text-white font-mono text-lg mb-4">EVIDENCE VAULT</h3>
            <ul className="space-y-2">
              {fileList.map((file, idx) => (
                <li key={idx} className="flex items-center text-osint-green font-mono">
                  <Paperclip size={16} className="mr-2" />
                  <span className="opacity-80 cursor-not-allowed">{file}</span>
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
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <input name="username" type="text" placeholder="CODENAME" className="w-full bg-[#121212] border border-[#333] text-white p-3 rounded font-mono" required />
          <input name="password" type="password" placeholder="ACCESS KEY" className="w-full bg-[#121212] border border-[#333] text-white p-3 rounded font-mono" required />
          <button type="submit" className="w-full bg-osint-green text-black font-bold font-mono py-3 rounded mt-4">AUTHENTICATE</button>
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
          <FileText className="mr-2 text-osint-green" /> NEW REPORT
        </h2>
        <form onSubmit={handleAddPost} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="title" type="text" placeholder="CASE TITLE" className="w-full bg-[#121212] border border-[#333] text-white p-3 rounded font-mono" required />
            <input name="author" type="text" defaultValue="NorthByte Analyst" className="w-full bg-[#121212] border border-[#333] text-white p-3 rounded font-mono" required />
          </div>
          <textarea name="content" rows={8} className="w-full bg-[#121212] border border-[#333] text-white p-3 rounded font-sans" placeholder="Enter analysis here..." required></textarea>
          <input name="files" type="file" multiple className="block w-full text-sm text-osint-muted file:bg-[#121212] file:text-osint-green hover:file:bg-[#333]" />
          <button type="submit" className="bg-osint-green text-black font-bold font-mono px-6 py-3 rounded">PUBLISH TO CLOUD</button>
        </form>
      </div>

      <div className="bg-osint-card border border-[#333] rounded-lg p-6">
        <h2 className="text-xl font-mono text-white mb-6">CLOUD DATABASE RECORDS</h2>
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
    <div className="min-h-screen flex flex-col font-sans selection:bg-osint-green selection:text-black">
      <header className="border-b border-[#333] py-8 text-center bg-[#121212]">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-mono text-white mb-2 tracking-tighter cursor-pointer" onClick={() => setView('home')}>
            Fact<span className="text-osint-green">Shield</span>.no
          </h1>
          <p className="text-osint-muted font-sans text-lg mb-4">Sannhetens Voktere</p>
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
        <p>&copy; 2026 FactShield.no | Cloud Connected</p>
      </footer>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);



import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Shield, Lock, FileText, Trash2, LogOut, ChevronLeft, Paperclip, User as UserIcon } from 'lucide-react';

// --- TİPLER ---
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

// --- BAŞLANGIÇ VERİSİ ---
// Site ilk açıldığında boş görünmesin diye bu otomatik yüklenir.
// Ama sen yenilerini ekledikçe bu liste uzayacak.
const DEFAULT_POSTS: Post[] = [
  {
    id: 1771,
    title: 'Endelig Sannhet: FactShield-Analyse Frikjenner Mette-Marit i Epstein-Saken',
    author: 'NorthByte Analyst',
    content: `OFFICIAL INTELLIGENCE BRIEFING // OFFISIELT SAKSSAMMENDRAG

STATUS: CONFIRMED / BEKREFTET
SUBJECT: H.K.H. Kronprinsesse Mette-Marit & Jeffrey Epstein
RESULT: EXONERATION / FRIKJENNELSE

NorthBytes kriminaltekniske analyse av 500+ dokumenter avslører at Kronprinsessen var et offer for manipulasjon, ikke en medskyldig. FactShield-algoritmer har kryssreferert flylogger, e-poster og vitneutsagn.

Konklusjon: Ingen bevis for ulovlig aktivitet. Saken er teknisk avsluttet.`,
    date: '2026-02-15',
    files: ['FactShield_Forensic_Report_v4.pdf', 'Chain_of_Custody_Log.txt']
  }
];

const App = () => {
  // --- DURUM YÖNETİMİ (STATE) ---
  const [view, setView] = useState<'home' | 'login' | 'admin' | 'post'>('home');
  const [activePostId, setActivePostId] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]); // TÜM POSTLAR BURADA TUTULUR
  const [notifications, setNotifications] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  // --- SİTE AÇILINCA VERİLERİ YÜKLE ---
  useEffect(() => {
    const storedPosts = localStorage.getItem("factshield_posts");
    
    if (storedPosts) {
      // Eğer hafızada daha önce eklediğin yazılar varsa onları getir
      setPosts(JSON.parse(storedPosts));
    } else {
      // Eğer hafıza boşsa, Mette-Marit raporunu yükle
      setPosts(DEFAULT_POSTS);
      localStorage.setItem("factshield_posts", JSON.stringify(DEFAULT_POSTS));
    }

    const storedUser = localStorage.getItem('factshield_user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  // --- KAYIT FONKSİYONU ---
  const savePosts = (newPosts: Post[]) => {
    setPosts(newPosts);
    localStorage.setItem('factshield_posts', JSON.stringify(newPosts));
  };

  // --- GİRİŞ / ÇIKIŞ ---
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

  // --- YENİ POST EKLEME ---
  const handleAddPost = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const title = (form.elements.namedItem('title') as HTMLInputElement).value;
    const author = (form.elements.namedItem('author') as HTMLInputElement).value;
    const content = (form.elements.namedItem('content') as HTMLTextAreaElement).value;
    const fileInput = form.elements.namedItem('files') as HTMLInputElement;
    const fileNames = fileInput.files ? Array.from(fileInput.files).map(f => f.name) : [];

    const newPost: Post = {
      id: Date.now(),
      title,
      author,
      content,
      date: new Date().toISOString().split('T')[0],
      files: fileNames
    };

    // YENİ POSTU EN BAŞA EKLE (LİSTE OLUŞUYOR)
    const updatedPosts = [newPost, ...posts];
    savePosts(updatedPosts);
    
    form.reset();
    showNotification('New Report Published', 'success');
  };

  const handleDeletePost = (id: number) => {
    if (confirm('Delete this report?')) {
      const updatedPosts = posts.filter(p => p.id !== id);
      savePosts(updatedPosts);
      showNotification('Report Deleted', 'success');
    }
  };

  const showNotification = (msg: string, type: 'success' | 'error') => {
    setNotifications({ msg, type });
    setTimeout(() => setNotifications(null), 3000);
  };

  // --- ANA SAYFA (HOME) GÖRÜNÜMÜ - LİSTELEME BURADA ---
  const renderHome = () => (
    <div className="space-y-6">
      {/* posts.map fonksiyonu, elindeki TÜM postları tek tek ekrana basar */}
      {posts.map(post => (
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
      ))}
      
      {posts.length === 0 && (
        <div className="p-8 text-center text-osint-muted border border-[#333] rounded">
          No reports found.
        </div>
      )}
    </div>
  );

  // --- DETAY SAYFASI GÖRÜNÜMÜ ---
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
        
        <h1 className="text-3xl font-mono text-white mb-4 border-b-2 border-osint-green pb-4">{post.title}</h1>
        <div className="text-sm text-osint-muted mb-8 font-mono flex gap-4">
          <span>CASE ID: #{post.id}</span>
          <span>DATE: {post.date}</span>
        </div>

        <div className="prose prose-invert max-w-none font-sans whitespace-pre-wrap text-lg leading-relaxed mb-8">
          {post.content}
        </div>

        {post.files.length > 0 && (
          <div className="mt-8 pt-6 border-t border-[#333]">
            <h3 className="text-white font-mono text-lg mb-4">EVIDENCE VAULT</h3>
            <ul className="space-y-2">
              {post.files.map((file, idx) => (
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

  // --- GİRİŞ EKRANI ---
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
        <p className="mt-4 text-center text-xs text-osint-muted">Demo: admin / admin123</p>
      </div>
    </div>
  );

  // --- ADMIN PANELİ (EKLEME & SİLME) ---
  const renderAdmin = () => (
    <div className="space-y-12">
      {/* YENİ POST EKLEME FORMU */}
      <div className="bg-osint-card border border-[#333] rounded-lg p-6">
        <h2 className="text-xl font-mono text-white mb-6 flex items-center">
          <FileText className="mr-2 text-osint-green" /> NEW REPORT
        </h2>
        <form onSubmit={handleAddPost} className="space-y-4">
          <input name="title" type="text" placeholder="CASE TITLE" className="w-full bg-[#121212] border border-[#333] text-white p-3 rounded font-mono" required />
          <input name="author" type="text" defaultValue="NorthByte Analyst" className="w-full bg-[#121212] border border-[#333] text-white p-3 rounded font-mono" required />
          <textarea name="content" rows={6} placeholder="INTELLIGENCE DATA..." className="w-full bg-[#121212] border border-[#333] text-white p-3 rounded font-sans" required></textarea>
          <input name="files" type="file" multiple className="block w-full text-sm text-osint-muted file:mr-4 file:py-2 file:px-4 file:bg-[#121212] file:text-osint-green hover:file:bg-[#333]" />
          <button type="submit" className="bg-osint-green text-black font-bold font-mono px-6 py-3 rounded">PUBLISH</button>
        </form>
      </div>

      {/* MEVCUT POSTLAR LİSTESİ (SİLMEK İÇİN) */}
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
        <p>&copy; 2026 FactShield.no | Independent Operation</p>
      </footer>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);

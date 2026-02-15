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

  // --- DETAY SAYFASI G

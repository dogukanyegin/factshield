import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Shield, Lock, FileText, Trash2, ChevronLeft, Paperclip, Server, CheckCircle, AlertTriangle } from 'lucide-react';

// --- TYPES (Veri Modelleri) ---
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

// --- MOCK DATABASE (Veritabanı Simülasyonu) ---
const App = () => {
  // State
  const [view, setView] = useState<'home' | 'login' | 'admin' | 'post'>('home');
  const [activePostId, setActivePostId] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [notifications, setNotifications] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // --- İŞLEMLER (Backend Yerine LocalStorage Kullanıyoruz) ---

  useEffect(() => {
    // 1. "Veritabanından" verileri çek
    setTimeout(() => { // Gerçekçilik için hafif gecikme
      const storedPosts = localStorage.getItem('factshield_db_posts');
      if (storedPosts) {
        setPosts(JSON.parse(storedPosts));
      } else {
        setPosts([]); // İlk açılışta boş
      }
      
      const storedUser = localStorage.getItem('factshield_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
    }, 800);
  }, []);

  const saveToDb = (newPosts: Post[]) => {
    setPosts(newPosts);
    localStorage.setItem('factshield_db_posts', JSON.stringify(newPosts));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const username = (form.elements.namedItem('username') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    // Basit doğrulama (Backend olmadığı için şifre burada kontrol edilir)
    if (username === 'admin' && password === 'admin123') {
      const newUser = { username };
      setUser(newUser);
      localStorage.setItem('factshield_user', JSON.stringify(newUser));
      setView('admin');
      showNotification('Erişim İzni Verildi - Güvenli Hat', 'success');
    } else {
      showNotification('Erişim Reddedildi: Geçersiz Kimlik', 'error');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('factshield_user');
    setView('home');
    showNotification('Oturum Sonlandırıldı', 'success');
  };

  const handleAddPost = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const title = (form.elements.namedItem('title') as HTMLInputElement).value;
    const content = (form.elements.namedItem('content') as HTMLTextAreaElement).value;
    const author = (form.elements.namedItem('author') as HTMLInputElement).value || user?.username || 'Bilinmeyen';
    
    // Dosya isimlerini simüle et (Gerçek dosya yükleme sunucu gerektirir)
    const fileInput = form.elements.namedItem('files') as HTMLInputElement;
    const fileNames = fileInput.files ? Array.from(fileInput.files).map(f => f.name) : [];

    const newPost: Post = {
      id: Date.now(),
      title,
      content,
      author,
      date: new Date().toISOString().split('T')[0],
      files: fileNames
    };

    // Listeyi güncelle ve kaydet
    const updatedPosts = [newPost, ...posts];
    saveToDb(updatedPosts);
    
    form.reset();
    showNotification('Vaka Dosyası Şifrelendi ve Kaydedildi', 'success');
  };

  const handleDeletePost = (id: number) => {
    if (confirm('DİKKAT: Bu veriyi kalıcı olarak silmek üzeresiniz. Onaylıyor musunuz?')) {
      const updatedPosts = posts.filter(p => p.id !== id);
      saveToDb(updatedPosts);
      showNotification('Kayıt Veritabanından Silindi', 'success');
      
      if (activePostId === id) {
        setActivePostId(null);
        setView('home');
      }
    }
  };

  const showNotification = (msg: string, type: 'success' | 'error') => {
    setNotifications({ msg, type });
    setTimeout(() => setNotifications(null), 3000);
  };

  // --- GÖRÜNÜM (UI) ---

  const renderHome = () => (
    <div className="space-y-6">
      {loading ? (
         <div className="flex flex-col items-center justify-center p-12 text-osint-green animate-pulse font-mono">
            <Server className="mb-4 h-12 w-12" />
            <p>&gt; GÜVENLİ AĞ BAĞLANTISI KURULUYOR...</p>
            <p className="text-xs mt-2 text-osint-muted">Handshaking via port 443...</p>
         </div>
      ) : posts.length === 0 ? (
        <div className="p-8 text-center bg-osint-card rounded border border-[#333]">
          <AlertTriangle className="mx-auto h-12 w-12 text-osint-muted mb-4" />
          <p className="text-osint-muted font-mono">YEREL VERİTABANINDA AKTİF İSTİHBARAT YOK.</p>
          <p className="text-xs text-gray-600 mt-2">Sistem bekleme modunda.</p>
        </div>
      ) : (
        posts.map(post => (
          <article key={post.id} className="bg-osint-card border border-[#333] rounded-lg p-6 shadow-lg hover:border-osint-green transition-all duration-300 group">
            <div className="flex justify-between items-start mb-2">
              <h2 
                className="text-2xl font-mono text-white cursor-pointer group-hover:text-osint-green group-hover:underline decoration-dotted underline-offset-4"
                onClick={() => { setActivePostId(post.id); setView('post'); }}
              >
                {post.title}
              </h2>
              <Lock size={16} className="text-osint-muted group-hover:text-osint-green" />
            </div>
            <div className="text-xs text-osint-muted mb-4 font-mono flex items-center gap-4">
              <span className="flex items-center"><CheckCircle size={12} className="mr-1" /> DOĞRULANDI</span>
              <span>TARİH: {post.date}</span>
              <span>AJAN: {post.author}</span>
            </div>
            <p className="text-osint-text mb-6 line-clamp-3 font-sans border-l-2 border-[#333] pl-4">
              {post.content}
            </p>
            <button 
              onClick={() => { setActivePostId(post.id); setView('post'); }}
              className="inline-flex items-center text-xs tracking-widest text-osint-green border border-osint-green px-6 py-2 rounded hover:bg-osint-green hover:text-black font-mono font-bold transition-all uppercase"
            >
              [ İncelemeyi Başlat ]
            </button>
          </article>
        ))
      )}
    </div>
  );

  const renderPostDetail = () => {
    const post = posts.find(p => p.id === activePostId);
    if (!post) return null;

    return (
      <div className="bg-osint-card border border-[#333] rounded-lg p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-

import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Shield, Lock, FileText, Trash2, ChevronLeft, Paperclip } from 'lucide-react';

// Backend Adresi (Flask varsayılan portu)
const API_URL = 'http://127.0.0.1:5000';

// Types
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

const App = () => {
  // State
  const [view, setView] = useState<'home' | 'login' | 'admin' | 'post'>('home');
  const [activePostId, setActivePostId] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]); // Başlangıçta boş liste
  const [notifications, setNotifications] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // --- API BAĞLANTILARI ---

  // 1. Verileri Veritabanından Çek (GET)
  const fetchPosts = async () => {
    try {
      setLoading(true);
      // Flask'ta tanımladığımız /api/posts rotasına istek atıyoruz
      const response = await fetch(`${API_URL}/api/posts`);
      
      if (!response.ok) throw new Error('Sunucu hatası');
      
      const data = await response.json();
      setPosts(data); // models.py'den gelen verileri state'e işle
    } catch (error) {
      console.error("Veri çekme hatası:", error);
      showNotification("Bağlantı Hatası: Backend çalışıyor mu?", 'error');
    } finally {
      setLoading(false);
    }
  };

  // Sayfa yüklendiğinde verileri çek
  useEffect(() => {
    fetchPosts();

    // Kullanıcı daha önce giriş yapmış mı kontrol et (localStorage sadece oturum için)
    const storedUser = localStorage.getItem('factshield_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // 2. Giriş Yap (POST)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const username = (form.elements.namedItem('username') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, // Flask form bekliyor olabilir
        body: new URLSearchParams({ username, password })
      });

      // Flask redirect veya success json döndürebilir. 
      // API modunda JSON bekliyoruz, ama redirect gelirse URL değişir.
      if (response.ok || response.url.includes('admin')) {
        const newUser = { username };
        setUser(newUser);
        localStorage.setItem('factshield_user', JSON.stringify(newUser));
        setView('admin');
        showNotification('Erişim İzni Verildi', 'success');
      } else {
        showNotification('Erişim Reddedildi: Hatalı Bilgiler', 'error');
      }
    } catch (error) {
      showNotification('Giriş Sistemi Çevrimdışı', 'error');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/logout`); // Backend oturumunu kapat
    } catch (e) {
      // Backend kapalıysa bile frontend'den çıkış yap
    }
    setUser(null);
    localStorage.removeItem('factshield_user');
    setView('home');
    showNotification('Çıkış Yapıldı', 'success');
  };

  // 3. Veri Ekle (POST - Dosya Yüklemeli)
  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    
    // FormData kullanıyoruz (Dosya gönderimi için gerekli)
    const formData = new FormData(form);
    
    // Eğer formda author yoksa veya boşsa, giriş yapmış kullanıcıyı ekle
    if (!formData.get('author') && user) {
        formData.set('author', user.username);
    }

    try {
      const response = await fetch(`${API_URL}/admin`, {
        method: 'POST',
        body: formData // Content-Type header'ı tarayıcı tarafından otomatik 'multipart/form-data' yapılır
      });

      if (response.ok) {
        await fetchPosts(); // Listeyi güncellemek için tekrar çek
        form.reset();
        showNotification('Analiz Ağa Yayınlandı', 'success');
      } else {
        showNotification('Yükleme Başarısız', 'error');
      }
    } catch (error) {
      showNotification('Ağ Hatası', 'error');
    }
  };

  // 4. Veri Sil (GET/DELETE)
  // Flask tarafında rotan /admin/delete/<id> şeklinde tanımlı
  const handleDeletePost = async (id: number) => {
    if (confirm('Silme Onayı: Bu işlem geri alınamaz.')) {
      try {
        const response = await fetch(`${API_URL}/admin/delete/${id}`);

        if (response.ok) {
          // Listeyi filtreleyerek güncelle (tekrar fetch yapmaya gerek kalmadan hızlı UI)
          setPosts(posts.filter(p => p.id !== id));
          showNotification('Kayıt Silindi', 'success');
          
          if (activePostId === id) {
             setActivePostId(null);
             setView('home');
          }
        } else {
            showNotification('Silme işlemi sunucuda başarısız oldu.', 'error');
        }
      } catch (error) {
        showNotification('Silme Başarısız: Sunucuya ulaşılamadı', 'error');
      }
    }
  };

  const showNotification = (msg: string, type: 'success' | 'error') => {
    setNotifications({ msg, type });
    setTimeout(() => setNotifications(null), 3000);
  };

  // --- GÖRÜNÜM FONKSİYONLARI ---

  const renderHome = () => (
    <div className="space-y-6">
      {loading ? (
         <div className="text-center text-osint-green animate-pulse font-mono">
            > BAĞLANTI KURULUYOR...
         </div>
      ) : posts.length === 0 ? (
        <div className="p-8 text-center text-osint-muted bg-osint-card rounded border border-[#333]">
          Yerel veritabanında istihbarat raporu bulunamadı.
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
              <span className="mr-4">TARİH: {post.date}</span>
              <span>ANALİST: {post.author}</span>
            </div>
            <p className="text-osint-text mb-6 line-clamp-3 font-sans">
              {post.content}
            </p>
            <button 
              onClick={() => { setActivePostId(post.id); setView('post'); }}
              className="inline-flex items-center text-osint-green border border-osint-green px-4 py-2 rounded hover:bg-osint-green hover:text-black font-mono font-bold transition-all"
            >
              TAM ANALİZİ OKU
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
      <div className="bg-osint-card border border-[#333] rounded-lg p-8 shadow-xl">
        <button 
          onClick={() => { setActivePostId(null); setView('home'); }} 
          className="mb-6 flex items-center text-osint-green hover:underline font-mono"
        >
          <ChevronLeft size={16} className="mr-1" /> İNDEKS'E DÖN
        </button>
        
        <h1 className="text-3xl font-mono text-white mb-2 border-b-2 border-osint-green pb-4">{post.title}</h1>
        <div className="text-sm text-osint-muted mb-8 font-mono flex gap-4">
          <span>KAYIT ID: #{post.id}</span>
          <span>TARİH: {post.date}</span>
          <span>ANALİST: {post.author}</span>
        </div>

        <div className="prose prose-invert max-w-none font-sans whitespace-pre-wrap text-lg leading-relaxed mb-8">
          {post.content}
        </div>

        {/* Flask API'den dosya isimleri geliyorsa */}
        {post.files && post.files.length > 0 && (
          <div className="mt-8 pt-6 border-t border-[#333]">
            <h3 className="text-white font-mono text-lg mb-4">KANIT KASASI</h3>
            <ul className="space-y-2">
              {post.files.map((filename, idx) => (
                <li key={idx} className="flex items-center text-osint-green font-mono">
                  <Paperclip size={16} className="mr-2" />
                  <a 
                    href={`${API_URL}/uploads/${filename}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="hover:underline cursor-pointer"
                  >
                    {filename}
                  </a>
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
          <h2 className="text-2xl font-mono text-white">GÜVENLİ GİRİŞ</h2>
          <p className="text-xs text-osint-muted uppercase tracking-widest mt-1">Sadece Yetkili Personel</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-osint-green font-mono text-sm mb-1">KOD ADI</label>
            <input name="username" type="text" className="w-full bg-[#121212] border border-[#333] text-white p-3 rounded focus:outline-none focus:border-osint-green font-mono" required />
          </div>
          <div>
            <label className="block text-osint-green font-mono text-sm mb-1">ERİŞİM ANAHTARI</label>
            <input name="password" type="password" className="w-full bg-[#121212] border border-[#333] text-white p-3 rounded focus:outline-none focus:border-osint-green font-mono" required />
          </div>
          <button type="submit" className="w-full bg-osint-green text-black font-bold font-mono py-3 rounded hover:bg-opacity-90 transition-all mt-4">
            DOĞRULA
          </button>
        </form>
        <div className="mt-4 text-center text-xs text-osint-muted">
          <p>Demo: admin / admin123</p>
        </div>
      </div>
    </div>
  );

  const renderAdmin = () => (
    <div className="space-y-12">
      {/* Post Oluşturma */}
      <div className="bg-osint-card border border-[#333] rounded-lg p-6">
        <h2 className="text-xl font-mono text-white mb-6 flex items-center">
          <FileText className="mr-2 text-osint-green" /> YENİ İSTİHBARAT RAPORU
        </h2>
        <form onSubmit={handleAddPost} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-osint-green font-mono text-sm mb-1">VAKA BAŞLIĞI</label>
              <input name="title" type="text" className="w-full bg-[#121212] border border-[#333] text-white p-3 rounded focus:outline-none focus:border-osint-green font-mono" required />
            </div>
            <div>
              <label className="block text-osint-green font-mono text-sm mb-1">ANALİST</label>
              <input name="author" type="text" defaultValue={user?.username} className="w-full bg-[#121212] border border-[#333] text-white p-3 rounded focus:outline-none focus:border-osint-green font-mono" required />
            </div>
          </div>
          <div>
            <label className="block text-osint-green font-mono text-sm mb-1">İSTİHBARAT VERİSİ</label>
            <textarea name="content" rows={8} className="w-full bg-[#121212] border border-[#333] text-white p-3 rounded focus:outline-none focus:border-osint-green font-sans" placeholder="Analizi buraya girin..." required></textarea>
          </div>
          <div>
            <label className="block text-osint-green font-mono text-sm mb-1">EKLER</label>
            <input name="files" type="file" multiple className="block w-full text-sm text-osint-muted file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-[#121212] file:text-osint-green hover:file:bg-[#333]" />
          </div>
          <button type="submit" className="bg-osint-green text-black font-bold font-mono px-6 py-3 rounded hover:bg-opacity-90 transition-all">
            AĞA YAYINLA
          </button>
        </form>
      </div>

      {/* Mevcut Postlar Listesi */}
      <div className="bg-osint-card border border-[#333] rounded-lg p-6">
        <h2 className="text-xl font-mono text-white mb-6">VERİTABANI KAYITLARI</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-sm">
            <thead>
              <tr className="border-b border-[#333] text-osint-green">
                <th className="p-3">TARİH</th>
                <th className="p-3">BAŞLIK</th>
                <th className="p-3">İŞLEM</th>
              </tr>
            </thead>
            <tbody>
              {posts.map(post => (
                <tr key={post.id} className="border-b border-[#333] hover:bg-[#121212]">
                  <td className="p-3 text-osint-muted">{post.date}</td>
                  <td className="p-3 text-white">{post.title}</td>
                  <td className="p-3">
                    <button onClick={() => handleDeletePost(post.id)} className="text-osint-danger hover:text-red-400 flex items-center">
                      <Trash2 size={16} className="mr-1" /> SİL
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

  const renderContent = () => {
    switch (view) {
      case 'home': return renderHome();
      case 'post': return renderPostDetail();
      case 'login': return renderLogin();
      case 'admin': return user ? renderAdmin() : renderLogin();
      default: return renderHome();
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-osint-green selection:text-black">
      {/* Header */}
      <header className="border-b border-[#333] py-8 text-center bg-[#121212]">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-mono text-white mb-2 tracking-tighter cursor-pointer" onClick={() => { setActivePostId(null); setView('home'); }}>
            Fact<span className="text-osint-green">Shield</span>.no
          </h1>
          <p className="text-osint-muted font-sans text-lg mb-4">Sannhetens Voktere - Vokter av Fakta, Ikke Meninger.</p>
          <div className="text-xs font-mono text-osint-green">
            POWERED BY <a href="#" className="font-bold underline decoration-dotted">NORTHBYTE OSINT DIVISION</a>
          </div>
          
          <nav className="mt-6 flex justify-center space-x-6 text-sm font-mono text-osint-muted">
            <button onClick={() => { setActivePostId(null); setView('home'); }} className={`hover:text-osint-green transition-colors ${view === 'home' || view === 'post' ? 'text-white' : ''}`}>ANA SAYFA</button>
            {user ? (
              <>
                <button onClick={() => setView('admin')} className={`hover:text-osint-green transition-colors ${view === 'admin' ? 'text-white' : ''}`}>KONTROL PANELİ</button>
                <button onClick={handleLogout} className="hover:text-osint-danger transition-colors flex items-center">ÇIKIŞ</button>
              </>
            ) : (
              <button onClick={() => setView('login')} className={`hover:text-osint-green transition-colors ${view === 'login' ? 'text-white' : ''}`}>ADMİN GİRİŞİ</button>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container max-w-4xl mx-auto px-4 py-8">
        {notifications && (
          <div className={`mb-6 p-4 rounded border font-mono ${notifications.type === 'success' ? 'bg-green-900/20 border-osint-green text-osint-green' : 'bg-red-900/20 border-osint-danger text-osint-danger'}`}>
            [{new Date().toLocaleTimeString()}] SİSTEM: {notifications.msg}
          </div>
        )}
        
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#333] py-8 text-center text-osint-muted text-sm font-mono bg-[#121212]">
        <p>&copy; 2026 FactShield.no | Independent Operation</p>
        <p className="mt-2 text-xs opacity-50">Güvenli Bağlantı Kuruldu. Loglama Aktif.</p>
      </footer>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);

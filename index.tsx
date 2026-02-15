import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Shield, Lock, FileText, Trash2, ChevronLeft, Paperclip, Server, CheckCircle, AlertTriangle } from 'lucide-react';

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

const App = () => {
  // State Tanımları
  const [view, setView] = useState<'home' | 'login' | 'admin' | 'post'>('home');
  const [activePostId, setActivePostId] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]); // BAŞLANGIÇTA LİSTE BOMBOŞ
  const [notifications, setNotifications] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // --- LOCALSTORAGE İŞLEMLERİ (Backend Yerine Tarayıcı Hafızası) ---

  useEffect(() => {
    // Sayfa açılınca sadece senin kaydettiklerini getir
    // O "Initial Data" saçmalığı burada yok artık.
    const storedPosts = localStorage.getItem('factshield_posts');
    if (storedPosts) {
      try {
        setPosts(JSON.parse(storedPosts));
      } catch (e) {
        setPosts([]);
      }
    } else {
      setPosts([]); // Eğer veri yoksa boş başla
    }

    // Kullanıcı oturumu kontrolü
    const storedUser = localStorage.getItem('factshield_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Verileri kaydetme fonksiyonu
  const savePostsToStorage = (newPosts: Post[]) => {
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
      showNotification('Erişim İzni Verildi', 'success');
    } else {
      showNotification('Hatalı Kimlik Bilgisi', 'error');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('factshield_user');
    setView('home');
    showNotification('Oturum Kapatıldı', 'success');
  };

  // --- POST EKLEME / SİLME ---
  const handleAddPost = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const title = (form.elements.namedItem('title') as HTMLInputElement).value;
    const content = (form.elements.namedItem('content') as HTMLTextAreaElement).value;
    const author = (form.elements.namedItem('author') as HTMLInputElement).value || user?.username || 'Bilinmeyen';
    
    // Dosya isimlerini al (Sadece görüntü olarak)
    const fileInput = form.elements.namedItem('files') as HTMLInputElement;
    const fileNames = fileInput.files ? Array.from(fileInput.files).map(f => f.name) : [];

    const newPost: Post = {
      id: Date.now(), // Benzersiz ID
      title,
      content,
      author,
      date: new Date().toISOString().split('T')[0],
      files: fileNames
    };

    // Yeni veriyi ekle ve kaydet
    const updatedPosts = [newPost, ...posts];
    savePostsToStorage(updatedPosts);
    
    form.reset();
    showNotification('Kayıt Başarıyla Eklendi', 'success');
  };

  const handleDeletePost = (id: number) => {
    if (confirm('Bu kaydı silmek istediğine emin misin?')) {
      const updatedPosts = posts.filter(p => p.id !== id);
      savePostsToStorage(updatedPosts);
      showNotification('Kayıt Silindi', 'success');
      
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

  // --- HTML ÇIKTILARI (RENDER) ---

  const renderHome = () => (
    <div className="space-y-6">
      {loading ? (
         <div className="text-center text-osint-green animate-pulse font-mono">
            &gt; SİSTEM YÜKLENİYOR...
         </div>
      ) : posts.length === 0 ? (
        <div className="p-8 text-center bg-osint-card rounded border border-[#333]">
          <AlertTriangle className="mx-auto h-12 w-12 text-osint-muted mb-4" />
          <p className="text-osint-muted font-mono">VERİTABANI BOŞ.</p>
          <p className="text-xs text-gray-600 mt-2">Henüz giriş yapılmamış.</p>
        </div>
      ) : (
        posts.map(post => (
          <article key={post.id} className="bg-osint-card border border-[#333] rounded-lg p-6 shadow-lg hover:border-osint-green transition-all duration-300 group">
            <div className="flex justify-between items-start mb-2">
              <h2 
                className="text-2xl font-mono text-white cursor-pointer group-hover:text-osint-green hover:underline decoration-dotted underline-offset-4"
                onClick={() => { setActivePostId(post.id); setView('post'); }}
              >
                {post.title}
              </h2>
              <Lock size={16} className="text-osint-muted group-hover:text-osint-green" />
            </div>
            <div className="text-xs text-osint-muted mb-4 font-mono flex items-center gap-4">
              <span className="flex items-center"><CheckCircle size={12} className="mr-1" /> ONAYLI</span>
              <span>TARİH: {post.date}</span>
              <span>YAZAR: {post.author}</span>
            </div>
            <p className="text-osint-text mb-6 line-clamp-3 font-sans border-l-2 border-[#333] pl-4">
              {post.content}
            </p>
            <button 
              onClick={() => { setActivePostId(post.id); setView('post'); }}
              className="inline-flex items-center text-xs tracking-widest text-osint-green border border-osint-green px-6 py-2 rounded hover:bg-osint-green hover:text-black font-mono font-bold transition-all uppercase"
            >
              [ İncele ]
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
          <ChevronLeft size={16} className="mr-1" /> LİSTEYE DÖN
        </button>
        
        <h1 className="text-3xl font-mono text-white mb-2 border-b-2 border-osint-green pb-4">{post.title}</h1>
        <div className="text-sm text-osint-muted mb-8 font-mono flex gap-4">
          <span>ID: #{post.id}</span>
          <span>TARİH: {post.date}</span>
          <span>YAZAR: {post.author}</span>
        </div>

        <div className="prose prose-invert max-w-none font-sans whitespace-pre-wrap text-lg leading-relaxed mb-8 text-gray-300">
          {post.content}
        </div>

        {post.files.length > 0 && (
          <div className="mt-8 pt-6 border-t border-[#333]">
            <h3 className="text-white font-mono text-lg mb-4">EKLİ DOSYALAR</h3>
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

  const renderLogin = () => (
    <div className="max-w-md mx-auto mt-10">
      <div className="bg-osint-card border border-[#333] rounded-lg p-8 shadow-xl">
        <div className="text-center mb-6">
          <Lock size={48} className="mx-auto text-osint-green mb-2" />
          <h2 className="text-2xl font-mono text-white">GÜVENLİ GİRİŞ</h2>
          <p className="text-xs text-osint-muted uppercase tracking-widest mt-1">Yetkili Personel</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-osint-green font-mono text-sm mb-1">KULLANICI ADI</label>
            <input 
              name="username" 
              type="text" 
              className="w-full bg-[#121212] border border-[#333] text-white p-3 rounded focus:outline-none focus:border-osint-green font-mono"
              required 
            />
          </div>
          <div>
            <label className="block text-osint-green font-mono text-sm mb-1">ŞİFRE</label>
            <input 
              name="password" 
              type="password" 
              className="w-full bg-[#121212] border border-[#333] text-white p-3 rounded focus:outline-none focus:border-osint-green font-mono"
              required 
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-osint-green text-black font-bold font-mono py-3 rounded hover:bg-opacity-90 transition-all mt-4"
          >
            SİSTEME GİR
          </button>
        </form>
        <div className="mt-4 text-center text-xs text-osint-muted">
          <p>Varsayılan: admin / admin123</p>
        </div>
      </div>
    </div>
  );

  const renderAdmin = () => (
    <div className="space-y-12">
      {/* Post Oluşturma */}
      <div className="bg-osint-card border border-[#333] rounded-lg p-6">
        <h2 className="text-xl font-mono text-white mb-6 flex items-center">
          <FileText className="mr-2 text-osint-green" /> YENİ KAYIT OLUŞTUR
        </h2>
        <form onSubmit={handleAddPost} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-osint-green font-mono text-sm mb-1">BAŞLIK</label>
              <input 
                name="title" 
                type="text" 
                className="w-full bg-[#121212] border border-[#333] text-white p-3 rounded focus:outline-none focus:border-osint-green font-mono"
                required 
              />
            </div>
            <div>
              <label className="block text-osint-green font-mono text-sm mb-1">YAZAR</label>
              <input 
                name="author" 
                type="text" 
                defaultValue={user?.username}
                className="w-full bg-[#121212] border border-[#333] text-white p-3 rounded focus:outline-none focus:border-osint-green font-mono"
                required 
              />
            </div>
          </div>
          <div>
            <label className="block text-osint-green font-mono text-sm mb-1">İÇERİK</label>
            <textarea 
              name="content" 
              rows={8}
              className="w-full bg-[#121212] border border-[#333] text-white p-3 rounded focus:outline-none focus:border-osint-green font-sans"
              placeholder="Analiz detaylarını buraya girin..."
              required 
            ></textarea>
          </div>
          <div>
            <label className="block text-osint-green font-mono text-sm mb-1">DOSYA EKİ (Görsel olarak)</label>
            <input 
              name="files" 
              type="file" 
              multiple 
              className="block w-full text-sm text-osint-muted file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-[#121212] file:text-osint-green hover:file:bg-[#333]"
            />
          </div>
          <button 
            type="submit" 
            className="bg-osint-green text-black font-bold font-mono px-6 py-3 rounded hover:bg-opacity-90 transition-all"
          >
            YAYINLA
          </button>
        </form>
      </div>

      {/* Mevcut Postlar Listesi */}
      <div className="bg-osint-card border border-[#333] rounded-lg p-6">
        <h2 className="text-xl font-mono text-white mb-6">MEVCUT KAYITLAR</h2>
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
                    <button 
                      onClick={() => handleDeletePost(post.id)}
                      className="text-osint-danger hover:text-red-400 flex items-center"
                    >
                      <Trash2 size={16} className="mr-1" /> SİL
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {posts.length === 0 && (
            <div className="p-4 text-center text-osint-muted">Hiç kayıt yok.</div>
          )}
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
            <button 
              onClick={() => { setActivePostId(null); setView('home'); }} 
              className={`hover:text-osint-green transition-colors ${view === 'home' || view === 'post' ? 'text-white' : ''}`}
            >
              ANA SAYFA
            </button>
            {user ? (
              <>
                <button 
                  onClick={() => setView('admin')} 
                  className={`hover:text-osint-green transition-colors ${view === 'admin' ? 'text-white' : ''}`}
                >
                  PANEL
                </button>
                <button 
                  onClick={handleLogout} 
                  className="hover:text-osint-danger transition-colors flex items-center"
                >
                  ÇIKIŞ
                </button>
              </>
            ) : (
              <button 
                onClick={() => setView('login')} 
                className={`hover:text-osint-green transition-colors ${view === 'login' ? 'text-white' : ''}`}
              >
                GİRİŞ
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container max-w-4xl mx-auto px-4 py-8">
        {notifications && (
          <div className={`mb-6 p-4 rounded border font-mono ${
            notifications.type === 'success' 
              ? 'bg-green-900/20 border-osint-green text-osint-green' 
              : 'bg-red-900/20 border-osint-danger text-osint-danger'
          }`}>
            [{new Date().toLocaleTimeString()}] SİSTEM: {notifications.msg}
          </div>
        )}
        
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#333] py-8 text-center text-osint-muted text-sm font-mono bg-[#121212]">
        <p>&copy; 2026 FactShield.no | Bağımsız Operasyon</p>
        <p className="mt-2 text-xs opacity-50">Güvenli Bağlantı Kuruldu.</p>
      </footer>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);

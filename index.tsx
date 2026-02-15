
import os
from flask import Flask, render_template, request, redirect, url_for, flash, send_from_directory
from flask_login import LoginManager, login_user, logout_user, login_required, current_user

from werkzeug.security import check_password_hash
from werkzeug.utils import secure_filename
from models import db, User, Post, File

app = Flask(__name__)
app.config['SECRET_KEY'] = 'factshield_secret_northbyte_99'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///factshield.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload

# Create upload folder if not exists
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

db.init_app(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# --- ROUTES ---

@app.route('/')
def index():
    posts = Post.query.order_by(Post.date.desc()).all()
    return render_template('index.html', posts=posts)

@app.route('/post/<int:post_id>')
def post_detail(post_id):
    post = Post.query.get_or_404(post_id)
    return render_template('post_detail.html', post=post)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('admin_dashboard'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        user = User.query.filter_by(username=username).first()
        
        if user and check_password_hash(user.password_hash, password):
            login_user(user)
            return redirect(url_for('admin_dashboard'))
        else:
            flash('Invalid credentials.', 'error')
            
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

@app.route('/admin', methods=['GET', 'POST'])
@login_required
def admin_dashboard():
    if request.method == 'POST':
        # Create Post Logic
        title = request.form.get('title')
        content = request.form.get('content')
        author = request.form.get('author')
        
        new_post = Post(title=title, content=content, author=author)
        db.session.add(new_post)
        db.session.flush() # Get the post ID for files
        
        # File Upload Logic
        files = request.files.getlist('files')
        for f in files:
            if f and f.filename:
                filename = secure_filename(f.filename)
                f.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                new_file = File(filename=filename, post_id=new_post.id)
                db.session.add(new_file)
        
        db.session.commit()
        flash('Case file added successfully.', 'success')
        return redirect(url_for('admin_dashboard'))

    posts = Post.query.order_by(Post.date.desc()).all()
    return render_template('admin.html', posts=posts)

@app.route('/admin/delete/<int:post_id>')
@login_required
def delete_post(post_id):
    post = Post.query.get_or_404(post_id)
    # Delete physical files
    for f in post.files:
        try:
            os.remove(os.path.join(app.config['UPLOAD_FOLDER'], f.filename))
        except OSError:
            pass
    db.session.delete(post)
    db.session.commit()
    flash('Case file deleted.', 'success')
    return redirect(url_for('admin_dashboard'))

@app.route('/uploads/<filename>')
def download_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == '__main__':
    app.run(debug=True)


import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Shield, Lock, FileText, Trash2, LogOut, ChevronLeft, Paperclip, User as UserIcon } from 'lucide-react';

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

// Mock Initial Data
const INITIAL_POSTS: Post[] = [
  {
    id: 1,
    title: "Operation: Silent Echo",
    author: "NorthByte Analyst",
    date: "2024-05-15",
    content: "Analysis of deep-sea cable anomalies suggests targeted interference pattern matching Group 77 signatures. Preliminary signal intelligence reveals coordinated frequency hopping.",
    files: ["spectrum_analysis_v2.pdf", "signal_log_raw.txt"]
  }
];

const App = () => {
  // State
  const [view, setView] = useState<'home' | 'login' | 'admin' | 'post'>('home');
  const [activePostId, setActivePostId] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [notifications, setNotifications] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  // Load data from localStorage on mount
  useEffect(() => {
    const storedPosts = localStorage.getItem('factshield_posts');
    if (storedPosts) {
      setPosts(JSON.parse(storedPosts));
    } else {
      setPosts(INITIAL_POSTS);
      localStorage.setItem('factshield_posts', JSON.stringify(INITIAL_POSTS));
    }

    const storedUser = localStorage.getItem('factshield_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Persist posts
  const savePosts = (newPosts: Post[]) => {
    setPosts(newPosts);
    localStorage.setItem('factshield_posts', JSON.stringify(newPosts));
  };

  // Login Logic
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

  // Post Logic
  const handleAddPost = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const title = (form.elements.namedItem('title') as HTMLInputElement).value;
    const author = (form.elements.namedItem('author') as HTMLInputElement).value;
    const content = (form.elements.namedItem('content') as HTMLTextAreaElement).value;
    // Mock file handling (just storing names as strings for demo)
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

    savePosts([newPost, ...posts]);
    form.reset();
    showNotification('Analysis Published to Network', 'success');
  };

  const handleDeletePost = (id: number) => {
    if (confirm('Confirm Deletion: This action is irreversible.')) {
      savePosts(posts.filter(p => p.id !== id));
      showNotification('Record Expunged', 'success');
    }
  };

  const showNotification = (msg: string, type: 'success' | 'error') => {
    setNotifications({ msg, type });
    setTimeout(() => setNotifications(null), 3000);
  };

  // Views
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
            <p className="text-osint-text mb-6 line-clamp-3 font-sans">
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
                  <span className="cursor-not-allowed opacity-80" title="File download simulated">{file}</span>
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
          <p className="text-xs text-osint-muted uppercase tracking-widest mt-1">Authorized Personnel Only</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-osint-green font-mono text-sm mb-1">CODENAME</label>
            <input 
              name="username" 
              type="text" 
              className="w-full bg-[#121212] border border-[#333] text-white p-3 rounded focus:outline-none focus:border-osint-green font-mono"
              required 
            />
          </div>
          <div>
            <label className="block text-osint-green font-mono text-sm mb-1">ACCESS KEY</label>
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
            AUTHENTICATE
          </button>
        </form>
        <div className="mt-4 text-center text-xs text-osint-muted">
          <p>Demo Credentials: admin / admin123</p>
        </div>
      </div>
    </div>
  );

  const renderAdmin = () => (
    <div className="space-y-12">
      {/* Create Post */}
      <div className="bg-osint-card border border-[#333] rounded-lg p-6">
        <h2 className="text-xl font-mono text-white mb-6 flex items-center">
          <FileText className="mr-2 text-osint-green" /> NEW INTELLIGENCE REPORT
        </h2>
        <form onSubmit={handleAddPost} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-osint-green font-mono text-sm mb-1">CASE TITLE</label>
              <input 
                name="title" 
                type="text" 
                className="w-full bg-[#121212] border border-[#333] text-white p-3 rounded focus:outline-none focus:border-osint-green font-mono"
                required 
              />
            </div>
            <div>
              <label className="block text-osint-green font-mono text-sm mb-1">ANALYST</label>
              <input 
                name="author" 
                type="text" 
                defaultValue="NorthByte Analyst"
                className="w-full bg-[#121212] border border-[#333] text-white p-3 rounded focus:outline-none focus:border-osint-green font-mono"
                required 
              />
            </div>
          </div>
          <div>
            <label className="block text-osint-green font-mono text-sm mb-1">INTELLIGENCE DATA</label>
            <textarea 
              name="content" 
              rows={8}
              className="w-full bg-[#121212] border border-[#333] text-white p-3 rounded focus:outline-none focus:border-osint-green font-sans"
              placeholder="Enter analysis here..."
              required 
            ></textarea>
          </div>
          <div>
            <label className="block text-osint-green font-mono text-sm mb-1">ATTACHMENTS</label>
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
            PUBLISH TO NETWORK
          </button>
        </form>
      </div>

      {/* Existing Posts List */}
      <div className="bg-osint-card border border-[#333] rounded-lg p-6">
        <h2 className="text-xl font-mono text-white mb-6">DATABASE RECORDS</h2>
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
                    <button 
                      onClick={() => handleDeletePost(post.id)}
                      className="text-osint-danger hover:text-red-400 flex items-center"
                    >
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
      {/* Header */}
      <header className="border-b border-[#333] py-8 text-center bg-[#121212]">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-mono text-white mb-2 tracking-tighter cursor-pointer" onClick={() => setView('home')}>
            Fact<span className="text-osint-green">Shield</span>.no
          </h1>
          <p className="text-osint-muted font-sans text-lg mb-4">Sannhetens Voktere - Vokter av Fakta, Ikke Meninger.</p>
          <div className="text-xs font-mono text-osint-green">
            POWERED BY <a href="#" className="font-bold underline decoration-dotted">NORTHBYTE OSINT DIVISION</a>
          </div>
          
          <nav className="mt-6 flex justify-center space-x-6 text-sm font-mono text-osint-muted">
            <button 
              onClick={() => setView('home')} 
              className={`hover:text-osint-green transition-colors ${view === 'home' ? 'text-white' : ''}`}
            >
              HOME
            </button>
            {user ? (
              <>
                <button 
                  onClick={() => setView('admin')} 
                  className={`hover:text-osint-green transition-colors ${view === 'admin' ? 'text-white' : ''}`}
                >
                  DASHBOARD
                </button>
                <button 
                  onClick={handleLogout} 
                  className="hover:text-osint-danger transition-colors flex items-center"
                >
                  LOGOUT
                </button>
              </>
            ) : (
              <button 
                onClick={() => setView('login')} 
                className={`hover:text-osint-green transition-colors ${view === 'login' ? 'text-white' : ''}`}
              >
                ADMIN ACCESS
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
            [{new Date().toLocaleTimeString()}] SYSTEM: {notifications.msg}
          </div>
        )}
        
        {view === 'home' && renderHome()}
        {view === 'post' && renderPostDetail()}
        {view === 'login' && renderLogin()}
        {view === 'admin' && (user ? renderAdmin() : renderLogin())}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#333] py-8 text-center text-osint-muted text-sm font-mono bg-[#121212]">
        <p>&copy; 2026 FactShield.no | Independent Operation</p>
        <p className="mt-2 text-xs opacity-50">Secure Connection Established. Logging Active.</p>
      </footer>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);

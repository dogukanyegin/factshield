
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

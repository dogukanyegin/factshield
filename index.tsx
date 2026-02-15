import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import { Lock, FileText, Trash2, ChevronLeft, Paperclip } from "lucide-react";

/* ================================
   SUPABASE CONFIG
================================ */
const SUPABASE_URL = "https://onnsaeorzwzgusdamqdi.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_ANON_KEY_HERE";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const ADMIN_EMAIL = "dogukan.yegin@hotmail.com";

/* ================================
   TYPES
================================ */
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

type FactShieldRow = {
  id: number | string;
  title: string;
  author: string | null;
  content: string | null;
  date: string | null;
  files: string | null;
};

/* ================================
   HELPERS
================================ */
function parseFiles(filesText: string | null): string[] {
  if (!filesText) return [];
  try {
    const parsed = JSON.parse(filesText);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {}
  return filesText.split(",").map(s => s.trim()).filter(Boolean);
}

function serializeFiles(files: string[]): string {
  return JSON.stringify(files ?? []);
}

/* ================================
   APP
================================ */
const App = () => {
  const [view, setView] = useState<"home" | "login" | "admin" | "post">("home");
  const [activePostId, setActivePostId] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [notification, setNotification] = useState<{msg:string,type:"success"|"error"}|null>(null);

  const activePost = useMemo(
    () => posts.find(p => p.id === activePostId) ?? null,
    [posts, activePostId]
  );

  const showNotification = (msg:string,type:"success"|"error")=>{
    setNotification({msg,type});
    setTimeout(()=>setNotification(null),3000);
  };

  /* ================================
     LOAD POSTS
  ================================= */
  const loadPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("FactShield")
      .select("id,title,author,content,date,files")
      .order("id", { ascending:false });

    if(error){
      showNotification(error.message,"error");
      setLoading(false);
      return;
    }

    const mapped:Post[] = ((data ?? []) as FactShieldRow[]).map(row=>({
      id:Number(row.id),
      title:row.title,
      author:row.author ?? "NorthByte Analyst",
      content:row.content ?? "",
      date:row.date ?? "",
      files:parseFiles(row.files)
    }));

    setPosts(mapped);
    setLoading(false);
  };

  /* ================================
     AUTH INIT
  ================================= */
  useEffect(()=>{
    let mounted=true;

    (async()=>{
      const { data } = await supabase.auth.getSession();
      const email = data.session?.user?.email ?? null;

      if(!mounted) return;

      if(email === ADMIN_EMAIL) setUser({username:"admin"});
      else setUser(null);

      setAuthReady(true);
      await loadPosts();
    })();

    const { data:sub } = supabase.auth.onAuthStateChange((_event,session)=>{
      const email = session?.user?.email ?? null;
      if(email === ADMIN_EMAIL) setUser({username:"admin"});
      else setUser(null);
    });

    return ()=>{
      mounted=false;
      sub.subscription.unsubscribe();
    };

  },[]);

  /* ================================
     LOGIN
  ================================= */
  const handleLogin = async (e:React.FormEvent)=>{
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const username = (form.elements.namedItem("username") as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    if(username !== "admin"){
      showNotification("Access Denied","error");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email:ADMIN_EMAIL,
      password
    });

    if(error){
      showNotification("Invalid Credentials","error");
      return;
    }

    setView("admin");
    showNotification("Access Granted","success");
    form.reset();
  };

  const handleLogout = async ()=>{
    await supabase.auth.signOut();
    setView("home");
    showNotification("Logged Out","success");
  };

  /* ================================
     INSERT
  ================================= */
  const handleAddPost = async (e:React.FormEvent)=>{
    e.preventDefault();
    if(!user){
      showNotification("Unauthorized","error");
      return;
    }

    const form = e.target as HTMLFormElement;
    const title = (form.elements.namedItem("title") as HTMLInputElement).value;
    const author = (form.elements.namedItem("author") as HTMLInputElement).value;
    const content = (form.elements.namedItem("content") as HTMLTextAreaElement).value;
    const fileInput = form.elements.namedItem("files") as HTMLInputElement;
    const fileNames = fileInput.files ? Array.from(fileInput.files).map(f=>f.name):[];

    const { error } = await supabase.from("FactShield").insert({
      title,
      author,
      content,
      date:new Date().toISOString().slice(0,10),
      files:serializeFiles(fileNames)
    });

    if(error){
      showNotification(error.message,"error");
      return;
    }

    form.reset();
    showNotification("Published","success");
    await loadPosts();
  };

  /* ================================
     DELETE
  ================================= */
  const handleDeletePost = async (id:number)=>{
    if(!user) return;

    if(!confirm("Delete permanently?")) return;

    const { error } = await supabase
      .from("FactShield")
      .delete()
      .eq("id",id);

    if(error){
      showNotification(error.message,"error");
      return;
    }

    showNotification("Deleted","success");
    await loadPosts();
  };

  /* ================================
     RENDER
  ================================= */
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl mb-6 cursor-pointer" onClick={()=>setView("home")}>
        FactShield
      </h1>

      {notification && (
        <div className={`mb-4 p-2 ${notification.type==="success"?"bg-green-800":"bg-red-800"}`}>
          {notification.msg}
        </div>
      )}

      {view==="home" && (
        <>
          {loading ? (
            <div>Loading...</div>
          ) : (
            posts.map(post=>(
              <div key={post.id} className="border p-4 mb-4">
                <h2 className="text-xl">{post.title}</h2>
                <div>{post.date} - {post.author}</div>
                <button onClick={()=>{setActivePostId(post.id);setView("post")}}>
                  Read
                </button>
              </div>
            ))
          )}
        </>
      )}

      {view==="post" && activePost && (
        <div>
          <button onClick={()=>setView("home")}>Back</button>
          <h2 className="text-2xl mt-4">{activePost.title}</h2>
          <div>{activePost.content}</div>
        </div>
      )}

      {view==="login" && (
        <form onSubmit={handleLogin}>
          <input name="username" placeholder="admin" required />
          <input name="password" type="password" required />
          <button type="submit">Login</button>
        </form>
      )}

      {view==="admin" && user && (
        <div>
          <button onClick={handleLogout}>Logout</button>
          <form onSubmit={handleAddPost} className="mt-4">
            <input name="title" placeholder="Title" required />
            <input name="author" defaultValue="NorthByte Analyst" required />
            <textarea name="content" rows={6} required />
            <input name="files" type="file" multiple />
            <button type="submit">Publish</button>
          </form>

          <div className="mt-6">
            {posts.map(post=>(
              <div key={post.id} className="border p-2 mt-2 flex justify-between">
                {post.title}
                <button onClick={()=>handleDeletePost(post.id)}>Delete</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!user && view!=="login" && (
        <button onClick={()=>setView("login")} className="mt-6">
          Admin Access
        </button>
      )}
    </div>
  );
};

/* ================================
   ROOT
================================ */
const root = createRoot(document.getElementById("root")!);
root.render(<App />);

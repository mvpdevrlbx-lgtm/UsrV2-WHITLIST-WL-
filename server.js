const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const SECRET = process.env.JWT_SECRET || 'dev-only-change-me';
const db = new Database(path.join(__dirname, 'nocta.sqlite'));
db.pragma('journal_mode = WAL');
db.exec(`
CREATE TABLE IF NOT EXISTS news (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 title TEXT NOT NULL,
 category TEXT NOT NULL DEFAULT 'INFO',
 body TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS verifications (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 rp_id TEXT NOT NULL,
 discord_tag TEXT,
 character_name TEXT,
 status TEXT NOT NULL DEFAULT 'pending',
 code TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 reviewed_by TEXT,
 reviewed_at TEXT
);
CREATE TABLE IF NOT EXISTS settings (
 key TEXT PRIMARY KEY,
 value TEXT NOT NULL
);
`);
if (!db.prepare('SELECT 1 FROM news LIMIT 1').get()) {
  db.prepare('INSERT INTO news(title,category,body) VALUES(?,?,?)').run('Bienvenue sur le portail RP','INFO','Le portail est ouvert. Les annonces officielles seront publiées ici.');
}

app.use(express.json({limit:'1mb'}));
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,'public')));

function users(){
 return [
  {user:process.env.ADMIN_OWNER_USER || 'owner', pass:process.env.ADMIN_OWNER_PASSWORD || ''},
  {user:process.env.ADMIN_COLLAB_USER || 'collab', pass:process.env.ADMIN_COLLAB_PASSWORD || ''}
 ].filter(x=>x.pass);
}
function sign(user){return jwt.sign({user,role:'admin'},SECRET,{expiresIn:'12h'});}
function auth(req,res,next){
 const token=(req.headers.authorization||'').replace(/^Bearer\s+/,'') || req.cookies?.token;
 try { const p=jwt.verify(token,SECRET); if(p.role!=='admin') throw new Error(); req.admin=p.user; next(); }
 catch { res.status(401).json({error:'Non autorisé'}); }
}
app.post('/api/login', async (req,res)=>{
 const {user,password}=req.body||{};
 const found=users().find(x=>x.user===user);
 if(!found || password !== found.pass) return res.status(401).json({error:'Identifiants incorrects'});
 // Passwords are compared against environment values; no password is stored in the database.
 res.json({token:sign(user),user});
});

app.get('/api/news',(req,res)=>res.json(db.prepare('SELECT * FROM news ORDER BY id DESC').all()));
app.post('/api/news',auth,(req,res)=>{
 const {title,category='INFO',body}=req.body||{};
 if(!title||!body) return res.status(400).json({error:'Titre et contenu requis'});
 const r=db.prepare('INSERT INTO news(title,category,body) VALUES(?,?,?)').run(title,category,body);
 res.json(db.prepare('SELECT * FROM news WHERE id=?').get(r.lastInsertRowid));
});
app.put('/api/news/:id',auth,(req,res)=>{
 const {title,category='INFO',body}=req.body||{};
 db.prepare('UPDATE news SET title=?,category=?,body=? WHERE id=?').run(title,category,body,req.params.id);
 res.json({ok:true});
});
app.delete('/api/news/:id',auth,(req,res)=>{db.prepare('DELETE FROM news WHERE id=?').run(req.params.id);res.json({ok:true});});

function code(){return String(Math.floor(100000+Math.random()*900000));}
app.post('/api/verification/request',(req,res)=>{
 const {rpId,discordTag,characterName}=req.body||{};
 if(!rpId) return res.status(400).json({error:'Identifiant RP requis'});
 const c=code();
 const r=db.prepare('INSERT INTO verifications(rp_id,discord_tag,character_name,code) VALUES(?,?,?,?)').run(rpId,discordTag||'',characterName||'',c);
 res.json({id:r.lastInsertRowid,code:c,message:'Demande enregistrée. Le code doit être transmis via le système Discord du serveur.'});
});
app.get('/api/verifications',auth,(req,res)=>res.json(db.prepare('SELECT * FROM verifications ORDER BY id DESC').all()));
app.post('/api/verifications/:id/status',auth,(req,res)=>{
 const allowed=['approved','rejected','pending']; const status=req.body?.status;
 if(!allowed.includes(status)) return res.status(400).json({error:'Statut invalide'});
 db.prepare('UPDATE verifications SET status=?,reviewed_by=?,reviewed_at=CURRENT_TIMESTAMP WHERE id=?').run(status,req.admin,req.params.id);
 res.json({ok:true});
});

app.get('/api/me',(req,res)=>{res.json({public:true});});
app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
app.listen(PORT,()=>console.log(`NOCTA RP V2: http://localhost:${PORT}`));

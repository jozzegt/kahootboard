const express=require('express'),cors=require('cors'),path=require('path'),fs=require('fs'),jwt=require('jsonwebtoken'),bcrypt=require('bcryptjs'),multer=require('multer'),XLSX=require('xlsx'),Database=require('better-sqlite3');
const app=express(),PORT=process.env.PORT||3000,SECRET=process.env.JWT_SECRET||'youcan-secret-2024';
const DB_PATH=process.env.DB_PATH||(fs.existsSync('/app/data')?'/app/data/data.db':path.join(__dirname,'data.db'));
console.log('DB:',DB_PATH);
const db=new Database(DB_PATH);
db.exec(`
  CREATE TABLE IF NOT EXISTS teacher(id INTEGER PRIMARY KEY,username TEXT UNIQUE NOT NULL,password TEXT NOT NULL,display_name TEXT NOT NULL DEFAULT 'Maestro',avatar TEXT NOT NULL DEFAULT '👨‍🏫');
  CREATE TABLE IF NOT EXISTS reg_codes(id INTEGER PRIMARY KEY AUTOINCREMENT,code TEXT UNIQUE NOT NULL,name TEXT NOT NULL,nivel TEXT NOT NULL DEFAULT '',used INTEGER NOT NULL DEFAULT 0);
  CREATE TABLE IF NOT EXISTS students(id INTEGER PRIMARY KEY AUTOINCREMENT,username TEXT UNIQUE NOT NULL,password TEXT NOT NULL,display_name TEXT NOT NULL,avatar TEXT NOT NULL DEFAULT '🐱',nivel TEXT NOT NULL DEFAULT '');
  CREATE TABLE IF NOT EXISTS sheet_data(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,k1 REAL,k2 REAL,k3 REAL,final REAL,nivel TEXT NOT NULL DEFAULT '');
`);
// Migración automática — agrega columna nivel si no existe en bases de datos antiguas
['students','sheet_data'].forEach(table=>{
  try{
    const cols=db.prepare(`PRAGMA table_info(${table})`).all().map(c=>c.name);
    if(!cols.includes('nivel')){
      db.prepare(`ALTER TABLE ${table} ADD COLUMN nivel TEXT NOT NULL DEFAULT ''`).run();
      console.log(`✓ Migración: columna nivel agregada a ${table}`);
    }
  }catch(e){console.log(`Migración ${table}:`,e.message);}
});
// Migración reg_codes — crear si no existe
if(!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='reg_codes'").get()){
  db.prepare(`CREATE TABLE reg_codes(id INTEGER PRIMARY KEY AUTOINCREMENT,code TEXT UNIQUE NOT NULL,name TEXT NOT NULL,nivel TEXT NOT NULL DEFAULT '',used INTEGER NOT NULL DEFAULT 0)`).run();
  console.log('✓ Migración: tabla reg_codes creada');
}

if(!db.prepare('SELECT id FROM teacher WHERE id=1').get())
  db.prepare('INSERT INTO teacher(id,username,password,display_name,avatar)VALUES(1,?,?,?,?)').run('maestro',bcrypt.hashSync('maestro123',10),'Maestro','👨‍🏫');

const INITIAL=[
  {name:'Alicia Santos',k1:76,k2:null,k3:null,final:25,nivel:'Level 1',code:'OHGI1J'},
  {name:'Aracely Mendonza',k1:56,k2:null,k3:null,final:19,nivel:'Level 1',code:'NYT7RP'},
  {name:'Avonne Stacey pimentel',k1:76,k2:null,k3:null,final:25,nivel:'Level 1',code:'WH6NNY'},
  {name:'Beder Hernandez',k1:null,k2:null,k3:null,final:null,nivel:'Level 1',code:'FX4M8T'},
  {name:'Dani',k1:80,k2:null,k3:null,final:27,nivel:'Level 1',code:'1QOJAH'},
  {name:'Edwin',k1:null,k2:null,k3:null,final:null,nivel:'Level 1',code:'9TQ6V9'},
  {name:'José',k1:null,k2:null,k3:null,final:null,nivel:'Level 1',code:'MH7F2V'},
  {name:'Julio Cesar Turque',k1:null,k2:null,k3:null,final:null,nivel:'Level 1',code:'97XBAR'},
  {name:'Kevin Mendez',k1:68,k2:null,k3:null,final:23,nivel:'Level 1',code:'3CPDLA'},
  {name:'Luis Rodriguez',k1:64,k2:null,k3:null,final:21,nivel:'Level 1',code:'LSH2BH'},
  {name:'Magda yanet (Deya)',k1:96,k2:null,k3:null,final:32,nivel:'Level 1',code:'JO1MZ7'},
  {name:'Maribel Juarez',k1:null,k2:null,k3:null,final:null,nivel:'Level 1',code:'E5V0VO'},
  {name:'Mario Eduardo',k1:null,k2:null,k3:null,final:null,nivel:'Level 1',code:'DFGGFH'},
  {name:'Mildre Mendoza Sandoval',k1:null,k2:null,k3:null,final:null,nivel:'Level 1',code:'U124E3'},
  {name:'Nathaly Martinez',k1:null,k2:null,k3:null,final:null,nivel:'Level 1',code:'GCKVBH'},
  {name:'Teresa Chavez',k1:92,k2:null,k3:null,final:31,nivel:'Level 1',code:'O3OOND'},
  {name:'Urice Mendez',k1:32,k2:null,k3:null,final:11,nivel:'Level 1',code:'57ZOPL'},
  {name:'Yadira',k1:null,k2:null,k3:null,final:null,nivel:'Level 1',code:'XXL5ZH'},
  {name:'Zuly',k1:52,k2:null,k3:null,final:17,nivel:'Level 1',code:'3YIK1C'},
  {name:'Alejandro Aguilar',k1:null,k2:null,k3:null,final:null,nivel:'Level 1',code:'P8JS65'},
  {name:'Britany Acevedo',k1:null,k2:null,k3:null,final:null,nivel:'Level 1',code:'2T7J5O'},
  {name:'Daniela Rangel',k1:null,k2:null,k3:null,final:null,nivel:'Level 1',code:'XVKYV9'},
  {name:'Edgar Estrada',k1:null,k2:null,k3:null,final:null,nivel:'Level 1',code:'YPN5MY'},
  {name:'Jennifer Ambrocio',k1:null,k2:null,k3:null,final:null,nivel:'Level 1',code:'Y8GXGX'},
  {name:'Katy Lopez',k1:68,k2:null,k3:null,final:23,nivel:'Level 1',code:'X05I4M'},
  {name:'Lidia',k1:null,k2:null,k3:null,final:null,nivel:'Level 1',code:'OETALY'},
  {name:'Melisa',k1:null,k2:null,k3:null,final:null,nivel:'Level 1',code:'0G2PH0'},
  {name:'Nahomi Reban',k1:null,k2:null,k3:null,final:null,nivel:'Level 1',code:'0QTWW1'},
  {name:'Vicente Yac',k1:null,k2:null,k3:null,final:null,nivel:'Level 1',code:'1HADLU'},
  {name:'William Aguilar',k1:null,k2:null,k3:null,final:null,nivel:'Level 1',code:'8PNU8V'},
  {name:'Yoan Ambrocio',k1:null,k2:null,k3:null,final:null,nivel:'Level 1',code:'K192OG'},
  {name:'Aby Lemus',k1:null,k2:null,k3:null,final:null,nivel:'Level 2',code:'QEEQ4Z'},
  {name:'Ashley N yat',k1:67,k2:null,k3:null,final:22,nivel:'Level 2',code:'P8GJJU'},
  {name:'Brithany Yudith',k1:53,k2:null,k3:null,final:18,nivel:'Level 2',code:'6N37R6'},
  {name:'Byron Bol',k1:null,k2:null,k3:null,final:null,nivel:'Level 2',code:'6RGCIQ'},
  {name:'Daniela',k1:null,k2:null,k3:null,final:null,nivel:'Level 2',code:'ALRM0U'},
  {name:'Daniela Ortiz',k1:90,k2:null,k3:null,final:30,nivel:'Level 2',code:'TWUOFV'},
  {name:'Erika',k1:60,k2:null,k3:null,final:20,nivel:'Level 2',code:'BBMI1F'},
  {name:'Fatima',k1:40,k2:null,k3:null,final:13,nivel:'Level 2',code:'PZP2EG'},
  {name:'Fernanda H',k1:67,k2:null,k3:null,final:22,nivel:'Level 2',code:'JNUHUZ'},
  {name:'Fredy Rosales',k1:null,k2:null,k3:null,final:null,nivel:'Level 2',code:'X3CY03'},
  {name:'Fredy Santiago',k1:27,k2:null,k3:null,final:9,nivel:'Level 2',code:'FD1XF5'},
  {name:'G Yadira',k1:null,k2:null,k3:null,final:null,nivel:'Level 2',code:'ZW1VMB'},
  {name:'Gabriela Rodriguez',k1:90,k2:null,k3:null,final:30,nivel:'Level 2',code:'MWGGER'},
  {name:'Giovany Lopez',k1:null,k2:null,k3:null,final:null,nivel:'Level 2',code:'80ANYD'},
  {name:'Henry Alvizuris',k1:67,k2:null,k3:null,final:22,nivel:'Level 2',code:'2IP25C'},
  {name:'Ingrid salazar',k1:80,k2:null,k3:null,final:27,nivel:'Level 2',code:'3541NL'},
  {name:'Jaquelin',k1:null,k2:null,k3:null,final:null,nivel:'Level 2',code:'BOKF75'},
  {name:'Joshua Ortega',k1:null,k2:null,k3:null,final:null,nivel:'Level 2',code:'3KEPCM'},
  {name:'Kate Castillo',k1:null,k2:null,k3:null,final:null,nivel:'Level 2',code:'VLML3B'},
  {name:'Mercy Zoraida',k1:null,k2:null,k3:null,final:null,nivel:'Level 2',code:'3VTYA5'},
  {name:'Olga Zaldaña',k1:null,k2:null,k3:null,final:null,nivel:'Level 2',code:'KOS6IS'},
  {name:'Paola Velasquez',k1:73,k2:null,k3:null,final:24,nivel:'Level 2',code:'9HXFUP'},
  {name:'Refugio',k1:40,k2:null,k3:null,final:13,nivel:'Level 2',code:'UBH6GK'},
  {name:'Robin Ramirez',k1:null,k2:null,k3:null,final:null,nivel:'Level 2',code:'9JUPAX'},
  {name:'Tania Hurtado',k1:90,k2:null,k3:null,final:30,nivel:'Level 2',code:'S79CVM'},
  {name:'Virginia Molina',k1:90,k2:null,k3:null,final:30,nivel:'Level 2',code:'E7DSIU'},
  {name:'Yesenia',k1:97,k2:null,k3:null,final:32,nivel:'Level 2',code:'H4PH2E'},
  {name:'Yoss',k1:73,k2:null,k3:null,final:24,nivel:'Level 2',code:'0I4JXY'},
  {name:'Maryori Esmeralda Juarez',k1:null,k2:null,k3:null,final:null,nivel:'Level 1',code:'S5TISY'},
  {name:'Allan',k1:57,k2:null,k3:null,final:19,nivel:'Level 3',code:'PSCJ1M'},
  {name:'Angela',k1:null,k2:null,k3:null,final:null,nivel:'Level 3',code:'G2BBCG'},
  {name:'Anthony Aguillon',k1:70,k2:null,k3:null,final:23,nivel:'Level 3',code:'BKJ7JU'},
  {name:'Cristina',k1:null,k2:null,k3:null,final:null,nivel:'Level 3',code:'K0EMFK'},
  {name:'Daniel Muñoz',k1:80,k2:null,k3:null,final:27,nivel:'Level 3',code:'JQ7AIV'},
  {name:'Edgar Chamale',k1:null,k2:null,k3:null,final:null,nivel:'Level 3',code:'4NMLNT'},
  {name:'Fernanda Velasquez',k1:83,k2:null,k3:null,final:28,nivel:'Level 3',code:'2AGHW1'},
  {name:'Grecia Mateo',k1:60,k2:null,k3:null,final:20,nivel:'Level 3',code:'CAEPY9'},
  {name:'Hilary Hernandez',k1:83,k2:null,k3:null,final:28,nivel:'Level 3',code:'NP516J'},
  {name:'Isa tenas',k1:97,k2:null,k3:null,final:32,nivel:'Level 3',code:'Z3JI7H'},
  {name:'Jackyale Reyes',k1:73,k2:null,k3:null,final:24,nivel:'Level 3',code:'LD5WIP'},
  {name:'Jay Perez',k1:null,k2:null,k3:null,final:null,nivel:'Level 3',code:'QA0CN0'},
  {name:'Jose Donato Perez',k1:60,k2:null,k3:null,final:20,nivel:'Level 3',code:'K16ZP7'},
  {name:'Mariela Tzaj',k1:83,k2:null,k3:null,final:28,nivel:'Level 3',code:'L9VT5D'},
  {name:'Odair Baltazar',k1:60,k2:null,k3:null,final:20,nivel:'Level 3',code:'K1C7QR'},
  {name:'Ricardo Hernandez',k1:73,k2:null,k3:null,final:24,nivel:'Level 3',code:'9DAUW5'},
  {name:'Sergio Arriola',k1:53,k2:null,k3:null,final:18,nivel:'Level 3',code:'G5XUA2'},
  {name:'Suany Fernandez',k1:27,k2:null,k3:null,final:9,nivel:'Level 3',code:'HY9AP7'},
  {name:'Victor Hugo',k1:null,k2:null,k3:null,final:null,nivel:'Level 3',code:'K43Y9Z'},
  {name:'Andrea',k1:77,k2:null,k3:null,final:26,nivel:'Level 3',code:'D41NDJ'},
  {name:'Benyamin M.',k1:93,k2:null,k3:null,final:31,nivel:'Level 3',code:'SJ9FJE'},
  {name:'Gabriel Galindo',k1:50,k2:null,k3:null,final:17,nivel:'Level 3',code:'03JO5V'},
  {name:'German Ramirez',k1:null,k2:null,k3:null,final:null,nivel:'Level 3',code:'H91LQS'},
  {name:'Haroldo Jorge',k1:63,k2:null,k3:null,final:21,nivel:'Level 3',code:'WQFLES'},
  {name:'Jimena Reyes',k1:77,k2:null,k3:null,final:26,nivel:'Level 3',code:'WVCU2U'},
  {name:'Mirna Reyna',k1:null,k2:null,k3:null,final:null,nivel:'Level 3',code:'M2O2AD'},
  {name:'Zurith Cinto',k1:43,k2:null,k3:null,final:14,nivel:'Level 3',code:'QDH71K'},
  {name:'Ana Carrera',k1:null,k2:null,k3:null,final:null,nivel:'Level 4',code:'E0ZGTX'},
  {name:'Claudia Morataya',k1:null,k2:null,k3:null,final:null,nivel:'Level 4',code:'DEA4KM'},
  {name:'Daniela Montenegro',k1:null,k2:null,k3:null,final:null,nivel:'Level 4',code:'BXJTMM'},
  {name:'Dina',k1:null,k2:null,k3:null,final:null,nivel:'Level 4',code:'BL6764'},
  {name:'Eduardo Lopez',k1:null,k2:null,k3:null,final:null,nivel:'Level 4',code:'3WVZ8V'},
  {name:'Evanyelin',k1:null,k2:null,k3:null,final:null,nivel:'Level 4',code:'U04TAV'},
  {name:'Fernando Olivares',k1:null,k2:null,k3:null,final:null,nivel:'Level 4',code:'MEBT8U'},
  {name:'Hivanny',k1:null,k2:null,k3:null,final:null,nivel:'Level 4',code:'4GL8Y0'},
  {name:'Jefferson Escobar',k1:null,k2:null,k3:null,final:null,nivel:'Level 4',code:'KYMHFG'},
  {name:'Jenni',k1:null,k2:null,k3:null,final:null,nivel:'Level 4',code:'DO5TNX'},
  {name:'Julia',k1:null,k2:null,k3:null,final:null,nivel:'Level 4',code:'7J79MC'},
  {name:'Juseth Serrano',k1:null,k2:null,k3:null,final:null,nivel:'Level 4',code:'Y7NLIE'},
  {name:'Leonel Klaudio Ovando',k1:null,k2:null,k3:null,final:null,nivel:'Level 4',code:'XK7OEY'},
  {name:'mayra boror',k1:null,k2:null,k3:null,final:null,nivel:'Level 4',code:'9E8X18'},
  {name:'Saraí Tax',k1:null,k2:null,k3:null,final:null,nivel:'Level 4',code:'TTFOTJ'},
  {name:'Shelsy',k1:null,k2:null,k3:null,final:null,nivel:'Level 4',code:'PN4M6I'},
  {name:'Sofia Xejap',k1:null,k2:null,k3:null,final:null,nivel:'Level 4',code:'XRK29E'},
  {name:'Yang Espinosa',k1:null,k2:null,k3:null,final:null,nivel:'Level 4',code:'3CM887'},
  {name:'Andriw',k1:null,k2:null,k3:null,final:null,nivel:'Level 7',code:'M09C30'},
  {name:'Bebolin gonzalez',k1:45,k2:null,k3:null,final:15,nivel:'Level 7',code:'7QX1RZ'},
  {name:'Bryan',k1:30,k2:null,k3:null,final:10,nivel:'Level 7',code:'HBH9P5'},
  {name:'Danna',k1:70,k2:null,k3:null,final:23,nivel:'Level 7',code:'87TKV1'},
  {name:'Deison',k1:null,k2:null,k3:null,final:null,nivel:'Level 7',code:'0BCBIO'},
  {name:'Edward de la cruz',k1:null,k2:null,k3:null,final:null,nivel:'Level 7',code:'N11KM6'},
  {name:'Fernando Godinez',k1:70,k2:null,k3:null,final:23,nivel:'Level 7',code:'YBL3TH'},
  {name:'Giovany Garcia',k1:null,k2:null,k3:null,final:null,nivel:'Level 7',code:'OYGJ4O'},
  {name:'Hilary Paredes',k1:20,k2:null,k3:null,final:7,nivel:'Level 7',code:'O98KAG'},
  {name:'Jenn Mira',k1:65,k2:null,k3:null,final:22,nivel:'Level 7',code:'9ZI65Z'},
  {name:'Jenni Quintana',k1:70,k2:null,k3:null,final:23,nivel:'Level 7',code:'ATIJOO'},
  {name:'Jennifer Moreno',k1:45,k2:null,k3:null,final:15,nivel:'Level 7',code:'5NFFQJ'},
  {name:'Karla',k1:60,k2:null,k3:null,final:20,nivel:'Level 7',code:'4W0GUY'},
  {name:'Katherine Alvarez',k1:45,k2:null,k3:null,final:15,nivel:'Level 7',code:'BOYF8H'},
  {name:'Kevin Perez',k1:null,k2:null,k3:null,final:null,nivel:'Level 7',code:'EY91TL'},
  {name:'Monica',k1:75,k2:null,k3:null,final:25,nivel:'Level 7',code:'HCIWI9'},
  {name:'Roger',k1:80,k2:null,k3:null,final:27,nivel:'Level 7',code:'FIO8MG'},
  {name:'Sam',k1:null,k2:null,k3:null,final:null,nivel:'Level 7',code:'0DQH9P'},
  {name:'Wilson Ixbalan',k1:45,k2:null,k3:null,final:15,nivel:'Level 7',code:'S8X9P5'},
  {name:'JoseM',k1:88,k2:92,k3:85,final:88,nivel:'Level 3',code:'JOSEM1'}
];

if(db.prepare('SELECT COUNT(*) as c FROM sheet_data').get().c===0){
  const insS=db.prepare('INSERT INTO sheet_data(name,k1,k2,k3,final,nivel)VALUES(?,?,?,?,?,?)');
  const insC=db.prepare('INSERT OR IGNORE INTO reg_codes(code,name,nivel)VALUES(?,?,?)');
  db.transaction(()=>{INITIAL.forEach(s=>{insS.run(s.name,s.k1,s.k2,s.k3,s.final,s.nivel);insC.run(s.code,s.name,s.nivel);});})();
  console.log('✓ Datos iniciales cargados -',INITIAL.length,'entradas');
}

app.use(cors());app.use(express.json());app.use(express.static(path.join(__dirname,'public')));
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:10*1024*1024}});
const signToken=p=>jwt.sign(p,SECRET,{expiresIn:'7d'});
function auth(req,res,next){const h=req.headers.authorization;if(!h)return res.status(401).json({error:'No autorizado'});try{req.user=jwt.verify(h.replace('Bearer ',''),SECRET);next();}catch{res.status(401).json({error:'Token inválido'});}}
const tOnly=(req,res,next)=>req.user?.role==='teacher'?next():res.status(403).json({error:'Solo el maestro'});

app.post('/api/login',(req,res)=>{
  const{username,password,role}=req.body;
  if(!username||!password||!role)return res.status(400).json({error:'Faltan datos'});
  if(role==='teacher'){const t=db.prepare('SELECT * FROM teacher WHERE id=1').get();if(!t||!bcrypt.compareSync(password,t.password))return res.status(401).json({error:'Usuario o contraseña incorrectos'});return res.json({token:signToken({id:t.id,role:'teacher',username:t.username,displayName:t.display_name,avatar:t.avatar}),role:'teacher',displayName:t.display_name,avatar:t.avatar});}
  if(role==='student'){const s=db.prepare('SELECT * FROM students WHERE LOWER(username)=LOWER(?)').get(username);if(!s||!bcrypt.compareSync(password,s.password))return res.status(401).json({error:'Usuario o contraseña incorrectos'});return res.json({token:signToken({id:s.id,role:'student',username:s.username,displayName:s.display_name,avatar:s.avatar,nivel:s.nivel}),role:'student',displayName:s.display_name,avatar:s.avatar,nivel:s.nivel});}
  res.status(400).json({error:'Rol inválido'});
});

app.post('/api/register',(req,res)=>{
  const{code,username,password}=req.body;
  if(!code||!username||!password)return res.status(400).json({error:'Faltan datos'});
  if(password.length<4)return res.status(400).json({error:'La contraseña debe tener al menos 4 caracteres'});
  const reg=db.prepare('SELECT * FROM reg_codes WHERE UPPER(code)=UPPER(?) AND used=0').get(code);
  if(!reg)return res.status(404).json({error:'Código inválido o ya utilizado'});
  if(db.prepare('SELECT id FROM students WHERE LOWER(username)=LOWER(?)').get(username))return res.status(409).json({error:'Ese usuario ya está tomado, elige otro'});
  const info=db.prepare('INSERT INTO students(username,password,display_name,avatar,nivel)VALUES(?,?,?,?,?)').run(username,bcrypt.hashSync(password,10),reg.name,'🐱',reg.nivel);
  db.prepare('UPDATE reg_codes SET used=1 WHERE id=?').run(reg.id);
  const token=signToken({id:info.lastInsertRowid,role:'student',username,displayName:reg.name,avatar:'🐱',nivel:reg.nivel});
  res.json({token,role:'student',displayName:reg.name,avatar:'🐱',nivel:reg.nivel});
});

app.get('/api/me/scores',auth,(req,res)=>{
  if(req.user.role!=='student')return res.status(403).json({error:'Solo alumnos'});
  const row=db.prepare('SELECT * FROM sheet_data WHERE LOWER(TRIM(name))=LOWER(TRIM(?))').get(req.user.displayName);
  res.json(row||null);
});
app.patch('/api/me/avatar',auth,(req,res)=>{
  const{avatar}=req.body;if(!avatar)return res.status(400).json({error:'Avatar requerido'});
  if(req.user.role==='student')db.prepare('UPDATE students SET avatar=? WHERE id=?').run(avatar,req.user.id);
  else db.prepare('UPDATE teacher SET avatar=? WHERE id=1').run(avatar);
  res.json({ok:true});
});
app.get('/api/teacher/students',auth,tOnly,(req,res)=>res.json(db.prepare('SELECT id,username,display_name,avatar,nivel FROM students ORDER BY nivel,display_name').all()));
app.post('/api/teacher/students',auth,tOnly,(req,res)=>{
  const{username,password,displayName,nivel}=req.body;
  if(!username||!password||!displayName)return res.status(400).json({error:'Faltan datos'});
  if(db.prepare('SELECT id FROM students WHERE LOWER(username)=LOWER(?)').get(username))return res.status(409).json({error:'Ese usuario ya existe'});
  const info=db.prepare('INSERT INTO students(username,password,display_name,avatar,nivel)VALUES(?,?,?,?,?)').run(username,bcrypt.hashSync(password,10),displayName,'🐱',nivel||'');
  res.json({id:info.lastInsertRowid,username,displayName,avatar:'🐱',nivel:nivel||''});
});
app.delete('/api/teacher/students/:id',auth,tOnly,(req,res)=>{db.prepare('DELETE FROM students WHERE id=?').run(req.params.id);res.json({ok:true});});
app.patch('/api/teacher/students/:id/reset',auth,tOnly,(req,res)=>{
  const{password}=req.body;if(!password)return res.status(400).json({error:'Contraseña requerida'});
  db.prepare('UPDATE students SET password=? WHERE id=?').run(bcrypt.hashSync(password,10),req.params.id);res.json({ok:true});
});
app.get('/api/teacher/codes',auth,tOnly,(req,res)=>res.json(db.prepare('SELECT * FROM reg_codes ORDER BY nivel,name').all()));
app.get('/api/teacher/sheet',auth,tOnly,(req,res)=>res.json(db.prepare('SELECT * FROM sheet_data ORDER BY nivel,name').all()));
app.post('/api/teacher/sheet/upload',auth,tOnly,upload.single('file'),(req,res)=>{
  if(!req.file)return res.status(400).json({error:'No se recibió archivo'});
  try{
    const wb=XLSX.read(req.file.buffer,{type:'buffer'});
    const sn=wb.SheetNames.find(n=>n.toUpperCase().includes('KAHOOT'))||wb.SheetNames[0];
    const rows=XLSX.utils.sheet_to_json(wb.Sheets[sn],{header:1});
    const pct=v=>{if(v==null||v==='')return null;let n=parseFloat(String(v).replace('%','').replace(',','.'));if(isNaN(n))return null;if(n>0&&n<=1)n=Math.round(n*100);return Math.round(n);};
    const h=rows[0]||[];const hasN=String(h[0]||'').toUpperCase().includes('NIVEL');
    const nm={'1':'Level 1','2':'Level 2','3':'Level 3','4':'Level 4','7':'Level 7'};
    const nd=[];
    for(let i=1;i<rows.length;i++){
      const r=rows[i];const nr=hasN?String(r[0]||'').trim():'';const name=hasN?String(r[1]||'').trim():String(r[0]||'').trim();
      if(!name)continue;
      const k1=hasN?pct(r[2]):pct(r[1]),k2=hasN?pct(r[3]):pct(r[2]),k3=hasN?pct(r[4]):pct(r[3]);
      const total=(k1||0)+(k2||0)+(k3||0);const final=total>0?Math.round(total/3):null;
      nd.push({name,k1,k2,k3,final,nivel:nm[nr]||nr});
    }
    if(nd.length===0)return res.status(400).json({error:'No se encontraron datos'});
    db.transaction(()=>{db.prepare('DELETE FROM sheet_data').run();const ins=db.prepare('INSERT INTO sheet_data(name,k1,k2,k3,final,nivel)VALUES(?,?,?,?,?,?)');nd.forEach(r=>ins.run(r.name,r.k1,r.k2,r.k3,r.final,r.nivel));})();
    res.json({ok:true,count:nd.length});
  }catch(e){res.status(500).json({error:'Error: '+e.message});}
});
app.patch('/api/teacher/config',auth,tOnly,(req,res)=>{
  const{displayName,username,password}=req.body;
  if(!displayName||!username)return res.status(400).json({error:'Nombre y usuario requeridos'});
  if(password)db.prepare('UPDATE teacher SET display_name=?,username=?,password=? WHERE id=1').run(displayName,username,bcrypt.hashSync(password,10));
  else db.prepare('UPDATE teacher SET display_name=?,username=? WHERE id=1').run(displayName,username);
  res.json({ok:true});
});

// ── Google Sheets sync ────────────────────────────────────────────
const SHEET_ID   = '1wLxVM_3jTuxUehxD2K1EWCAq5uHITp8vVmn7AOtTYUA';
const SHEET_NAME = 'kahoots';

async function fetchGoogleSheet() {
  const https = require('https');
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;
  return new Promise((resolve,reject)=>{
    https.get(url,res=>{
      if(res.statusCode===302||res.statusCode===301){
        https.get(res.headers.location,r2=>{let d='';r2.on('data',c=>d+=c);r2.on('end',()=>resolve(d));}).on('error',reject);
        return;
      }
      let data='';
      res.on('data',c=>data+=c);
      res.on('end',()=>{
        if(res.statusCode!==200)return reject(new Error(`HTTP ${res.statusCode}`));
        resolve(data);
      });
    }).on('error',reject);
  });
}

function parseSheetCSV(csv) {
  const lines=csv.split('\n').filter(l=>l.trim());
  const pct=v=>{if(!v||v.trim()===''||v.trim()==='-')return null;let n=parseFloat(v.replace('%','').replace(/"/g,'').replace(',','.'));if(isNaN(n))return null;if(n>0&&n<=1)n=Math.round(n*100);return Math.round(n);};
  const nivelMap={'1':'Level 1','2':'Level 2','3':'Level 3','4':'Level 4','7':'Level 7'};
  const results=[];
  for(let i=1;i<lines.length;i++){
    const cols=[];let cur='',inQ=false;
    for(const ch of lines[i]){if(ch==='"')inQ=!inQ;else if(ch===','&&!inQ){cols.push(cur.trim());cur='';}else cur+=ch;}
    cols.push(cur.trim());
    const nivelRaw=(cols[0]||'').replace(/"/g,'').trim();
    const name=(cols[1]||'').replace(/"/g,'').trim();
    if(!name)continue;
    // Col C=K1, D=K2, E=K3, skip F, G=notas, H=final
    const k1=pct(cols[2]),k2=pct(cols[3]),k3=pct(cols[4]);
    const finalPct=pct(cols[7]); // columna H
    const total=(k1||0)+(k2||0)+(k3||0);
    const final=finalPct!==null?finalPct:(total>0?Math.round(total/3):null);
    const nivel=nivelMap[nivelRaw]||nivelRaw||'';
    results.push({name,k1,k2,k3,final,nivel});
  }
  return results;
}

// Sync automático desde Google Sheets
app.post('/api/teacher/sheet/sync',auth,tOnly,async(req,res)=>{
  try{
    const csv=await fetchGoogleSheet();
    const data=parseSheetCSV(csv);
    if(data.length===0)return res.status(400).json({error:'No se encontraron datos en la hoja'});
    db.transaction(()=>{
      db.prepare('DELETE FROM sheet_data').run();
      const ins=db.prepare('INSERT INTO sheet_data(name,k1,k2,k3,final,nivel)VALUES(?,?,?,?,?,?)');
      data.forEach(r=>ins.run(r.name,r.k1,r.k2,r.k3,r.final,r.nivel));
    })();
    res.json({ok:true,count:data.length});
  }catch(e){res.status(500).json({error:'Error al conectar con Google Sheets: '+e.message});}
});

// ── Crear código desde panel ──────────────────────────────────────
app.post('/api/teacher/codes',auth,tOnly,(req,res)=>{
  const{name,nivel}=req.body;
  if(!name||!nivel)return res.status(400).json({error:'Nombre y nivel requeridos'});
  // Verificar que no exista ya un código para ese nombre
  const existing=db.prepare('SELECT * FROM reg_codes WHERE LOWER(TRIM(name))=LOWER(TRIM(?))').get(name);
  if(existing)return res.status(409).json({error:'Ya existe un código para ese alumno',code:existing.code,used:existing.used});
  // Generar código único
  const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code='';
  do{code=Array.from({length:6},()=>chars[Math.floor(Math.random()*chars.length)]).join('');}
  while(db.prepare('SELECT id FROM reg_codes WHERE code=?').get(code));
  db.prepare('INSERT INTO reg_codes(code,name,nivel)VALUES(?,?,?)').run(code,name.trim(),nivel);
  // Agregar a sheet_data si no existe aún
  const inSheet=db.prepare('SELECT id FROM sheet_data WHERE LOWER(TRIM(name))=LOWER(TRIM(?))').get(name);
  if(!inSheet)db.prepare('INSERT INTO sheet_data(name,k1,k2,k3,final,nivel)VALUES(?,?,?,?,?,?)').run(name.trim(),null,null,null,null,nivel);
  res.json({ok:true,code,name:name.trim(),nivel});
});

// ── Eliminar código ───────────────────────────────────────────────
app.delete('/api/teacher/codes/:id',auth,tOnly,(req,res)=>{
  db.prepare('DELETE FROM reg_codes WHERE id=?').run(req.params.id);
  res.json({ok:true});
});

// ── Export backup CSV ─────────────────────────────────────────────
app.get('/api/teacher/export',auth,tOnly,(req,res)=>{
  const students=db.prepare('SELECT username,display_name,nivel,avatar FROM students ORDER BY nivel,display_name').all();
  const codes=db.prepare('SELECT code,name,nivel,used FROM reg_codes ORDER BY nivel,name').all();
  let csv='ALUMNOS REGISTRADOS\n';
  csv+='Usuario,Nombre,Nivel,Avatar\n';
  students.forEach(s=>csv+=`${s.username},"${s.display_name}",${s.nivel},${s.avatar}\n`);
  csv+='\nCÓDIGOS DE REGISTRO\n';
  csv+='Código,Nombre,Nivel,Usado\n';
  codes.forEach(c=>csv+=`${c.code},"${c.name}",${c.nivel},${c.used?'Sí':'No'}\n`);
  res.setHeader('Content-Type','text/csv; charset=utf-8');
  res.setHeader('Content-Disposition','attachment; filename=youcan-backup.csv');
  res.send('\uFEFF'+csv); // BOM para que Excel lo abra correctamente
});

app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
app.listen(PORT,()=>console.log(`✓ YOUCAN Portal en puerto ${PORT}`));

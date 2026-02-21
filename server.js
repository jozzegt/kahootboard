const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const fs       = require('fs');
const jwt      = require('jsonwebtoken');
const bcrypt   = require('bcryptjs');
const multer   = require('multer');
const XLSX     = require('xlsx');
const Database = require('better-sqlite3');

const app    = express();
const PORT   = process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET || 'kahootboard-secret-2024';

// ── Base de datos SQLite ──────────────────────────────────────────
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data.db');
const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS teacher (
    id       INTEGER PRIMARY KEY,
    username TEXT    UNIQUE NOT NULL,
    password TEXT    NOT NULL,
    display_name TEXT NOT NULL DEFAULT 'Maestro',
    avatar   TEXT    NOT NULL DEFAULT '👨‍🏫'
  );

  CREATE TABLE IF NOT EXISTS students (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    username     TEXT    UNIQUE NOT NULL,
    password     TEXT    NOT NULL,
    display_name TEXT    NOT NULL,
    avatar       TEXT    NOT NULL DEFAULT '🐱'
  );

  CREATE TABLE IF NOT EXISTS sheet_data (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    name  TEXT    NOT NULL,
    k1    REAL,
    k2    REAL,
    k3    REAL,
    final REAL
  );
`);

// Insertar maestro por defecto si no existe
const teacherExists = db.prepare('SELECT id FROM teacher WHERE id=1').get();
if (!teacherExists) {
  const hash = bcrypt.hashSync('maestro123', 10);
  db.prepare('INSERT INTO teacher (id, username, password, display_name, avatar) VALUES (1,?,?,?,?)').run('maestro', hash, 'Maestro', '👨‍🏫');
}

// Cargar datos iniciales del Excel si la tabla está vacía
const sheetEmpty = db.prepare('SELECT COUNT(*) as c FROM sheet_data').get().c === 0;
if (sheetEmpty) {
  const defaultData = [
    {name:"Alejandro Aguilar",    k1:47,  k2:39,  k3:null, final:29},
    {name:"Andrea",               k1:87,  k2:75,  k3:null, final:54},
    {name:"Andriw",               k1:null,k2:null,k3:null, final:null},
    {name:"Anthony Aguillon",     k1:83,  k2:87,  k3:null, final:57},
    {name:"Bryan",                k1:78,  k2:70,  k3:null, final:49},
    {name:"Cristina",             k1:null,k2:null,k3:null, final:null},
    {name:"Daniela Gladys Ortiz", k1:30,  k2:55,  k3:null, final:28},
    {name:"Danna",                k1:84,  k2:78,  k3:null, final:54},
    {name:"Deison",               k1:92,  k2:null,k3:null, final:31},
    {name:"Edgar Chamale",        k1:60,  k2:60,  k3:null, final:40},
    {name:"Elvis",                k1:73,  k2:70,  k3:null, final:48},
    {name:"Fatima",               k1:50,  k2:null,k3:null, final:17},
    {name:"Fer Velasquez",        k1:93,  k2:97,  k3:null, final:63},
    {name:"Fernando",             k1:76,  k2:null,k3:null, final:25},
    {name:"Fredy Rosales",        k1:null,k2:null,k3:null, final:null},
    {name:"Gabriel Galindo",      k1:53,  k2:50,  k3:null, final:34},
    {name:"German Ramirez",       k1:70,  k2:null,k3:null, final:23},
    {name:"Giovany Garcia",       k1:84,  k2:null,k3:null, final:28},
    {name:"Giovany Lopez",        k1:null,k2:null,k3:null, final:null},
    {name:"Grecia Mateo",         k1:73,  k2:60,  k3:null, final:44},
    {name:"Hilary Hernandez",     k1:80,  k2:85,  k3:null, final:55},
    {name:"Hilary Paredes",       k1:64,  k2:59,  k3:null, final:41},
    {name:"Iliana Valenzuela",    k1:null,k2:null,k3:null, final:null},
    {name:"Isa Tenas",            k1:77,  k2:93,  k3:null, final:57},
    {name:"Jenni nuevo",          k1:92,  k2:null,k3:null, final:31},
    {name:"Jimena Reyes",         k1:50,  k2:78,  k3:null, final:43},
    {name:"Jose Donato Perez",    k1:60,  k2:63,  k3:null, final:41},
    {name:"Jose Felix",           k1:null,k2:null,k3:null, final:null},
    {name:"Kate Castillo",        k1:53,  k2:null,k3:null, final:18},
    {name:"Mariela Tzaj",         k1:70,  k2:null,k3:null, final:23},
    {name:"Melany Castellanos",   k1:77,  k2:80,  k3:null, final:52},
    {name:"Mirna Reyna",          k1:83,  k2:78,  k3:null, final:54},
    {name:"Monica Tock",          k1:92,  k2:79,  k3:null, final:57},
    {name:"Odair Baltazar",       k1:null,k2:null,k3:null, final:null},
    {name:"Olga Zaldaña",         k1:63,  k2:null,k3:null, final:21},
    {name:"Refugio",              k1:43,  k2:51,  k3:null, final:31},
    {name:"Ricardo Hernandez",    k1:63,  k2:null,k3:null, final:21},
    {name:"Rolando Consuegra",    k1:null,k2:null,k3:null, final:null},
    {name:"Sergio Arriola",       k1:47,  k2:65,  k3:null, final:37},
    {name:"Suany Fernandez",      k1:67,  k2:53,  k3:null, final:40},
    {name:"Victor Hugo",          k1:70,  k2:null,k3:null, final:23},
    {name:"Wilson Ixbalan",       k1:64,  k2:67,  k3:null, final:44},
    {name:"Yadira Greysi",        k1:null,k2:null,k3:null, final:null},
    {name:"Zurith Cinto",         k1:null,k2:null,k3:null, final:null},
  ];
  const ins = db.prepare('INSERT INTO sheet_data (name,k1,k2,k3,final) VALUES (?,?,?,?,?)');
  const insertAll = db.transaction(rows => { rows.forEach(r => ins.run(r.name, r.k1, r.k2, r.k3, r.final)); });
  insertAll(defaultData);
  console.log('✓ Datos iniciales cargados en base de datos');
}

// ── Middleware ────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ── Auth helpers ──────────────────────────────────────────────────
function signToken(payload) { return jwt.sign(payload, SECRET, { expiresIn: '7d' }); }
function authMiddleware(req, res, next) {
  const h = req.headers.authorization;
  if (!h) return res.status(401).json({ error: 'No autorizado' });
  try { req.user = jwt.verify(h.replace('Bearer ', ''), SECRET); next(); }
  catch { res.status(401).json({ error: 'Token inválido' }); }
}
function teacherOnly(req, res, next) {
  if (req.user?.role !== 'teacher') return res.status(403).json({ error: 'Solo el maestro' });
  next();
}

// ════════════════════════════════════════════════════════════════
// RUTAS API
// ════════════════════════════════════════════════════════════════

// ── POST /api/login ───────────────────────────────────────────────
app.post('/api/login', (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role) return res.status(400).json({ error: 'Faltan datos' });

  if (role === 'teacher') {
    const t = db.prepare('SELECT * FROM teacher WHERE id=1').get();
    if (!t || !bcrypt.compareSync(password, t.password))
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    const token = signToken({ id: t.id, role: 'teacher', username: t.username, displayName: t.display_name, avatar: t.avatar });
    return res.json({ token, role: 'teacher', displayName: t.display_name, avatar: t.avatar });
  }

  if (role === 'student') {
    const s = db.prepare('SELECT * FROM students WHERE LOWER(username)=LOWER(?)').get(username);
    if (!s || !bcrypt.compareSync(password, s.password))
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    const token = signToken({ id: s.id, role: 'student', username: s.username, displayName: s.display_name, avatar: s.avatar });
    return res.json({ token, role: 'student', displayName: s.display_name, avatar: s.avatar });
  }

  res.status(400).json({ error: 'Rol inválido' });
});

// ── GET /api/me/scores — alumno ve sus notas ──────────────────────
app.get('/api/me/scores', authMiddleware, (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ error: 'Solo alumnos' });
  const name = req.user.displayName;
  const row  = db.prepare('SELECT * FROM sheet_data WHERE LOWER(TRIM(name))=LOWER(TRIM(?))').get(name);
  res.json(row || null);
});

// ── PATCH /api/me/avatar — alumno cambia su avatar ───────────────
app.patch('/api/me/avatar', authMiddleware, (req, res) => {
  const { avatar } = req.body;
  if (!avatar) return res.status(400).json({ error: 'Avatar requerido' });

  if (req.user.role === 'student') {
    db.prepare('UPDATE students SET avatar=? WHERE id=?').run(avatar, req.user.id);
  } else {
    db.prepare('UPDATE teacher SET avatar=? WHERE id=1').run(avatar);
  }
  res.json({ ok: true });
});

// ── GET /api/teacher/students — lista de alumnos ─────────────────
app.get('/api/teacher/students', authMiddleware, teacherOnly, (req, res) => {
  const rows = db.prepare('SELECT id, username, display_name, avatar FROM students ORDER BY display_name').all();
  res.json(rows);
});

// ── POST /api/teacher/students — agregar alumno ───────────────────
app.post('/api/teacher/students', authMiddleware, teacherOnly, (req, res) => {
  const { username, password, displayName } = req.body;
  if (!username || !password || !displayName) return res.status(400).json({ error: 'Faltan datos' });
  const exists = db.prepare('SELECT id FROM students WHERE LOWER(username)=LOWER(?)').get(username);
  if (exists) return res.status(409).json({ error: 'Ese usuario ya existe' });
  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare('INSERT INTO students (username, password, display_name, avatar) VALUES (?,?,?,?)').run(username, hash, displayName, '🐱');
  res.json({ id: info.lastInsertRowid, username, displayName, avatar: '🐱' });
});

// ── DELETE /api/teacher/students/:id ─────────────────────────────
app.delete('/api/teacher/students/:id', authMiddleware, teacherOnly, (req, res) => {
  db.prepare('DELETE FROM students WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ── GET /api/teacher/sheet — ver todas las notas ─────────────────
app.get('/api/teacher/sheet', authMiddleware, teacherOnly, (req, res) => {
  const rows = db.prepare('SELECT * FROM sheet_data ORDER BY name').all();
  res.json(rows);
});

// ── POST /api/teacher/sheet/upload — subir Excel ─────────────────
app.post('/api/teacher/sheet/upload', authMiddleware, teacherOnly, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió archivo' });
  try {
    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = wb.SheetNames.find(n => n.toUpperCase().includes('KAHOOT')) || wb.SheetNames[0];
    const ws   = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

    const pct = v => {
      if (v === null || v === undefined || v === '') return null;
      let n = parseFloat(String(v).replace('%','').replace(',','.'));
      if (isNaN(n)) return null;
      if (n > 0 && n <= 1) n = Math.round(n * 100);
      return Math.round(n);
    };

    const newData = [];
    for (let i = 1; i < rows.length; i++) {
      const row  = rows[i];
      const name = row[0] ? String(row[0]).trim() : '';
      if (!name) continue;
      const k1 = pct(row[1]), k2 = pct(row[2]), k3 = pct(row[3]);
      const total = (k1||0)+(k2||0)+(k3||0);
      const final = total > 0 ? Math.round(total/3) : null;
      newData.push({ name, k1, k2, k3, final });
    }

    if (newData.length === 0) return res.status(400).json({ error: 'No se encontraron datos en el archivo' });

    // Reemplazar todos los datos
    const replaceAll = db.transaction(data => {
      db.prepare('DELETE FROM sheet_data').run();
      const ins = db.prepare('INSERT INTO sheet_data (name,k1,k2,k3,final) VALUES (?,?,?,?,?)');
      data.forEach(r => ins.run(r.name, r.k1, r.k2, r.k3, r.final));
    });
    replaceAll(newData);

    res.json({ ok: true, count: newData.length });
  } catch(e) {
    res.status(500).json({ error: 'Error procesando el archivo: ' + e.message });
  }
});

// ── PATCH /api/teacher/config — cambiar credenciales maestro ──────
app.patch('/api/teacher/config', authMiddleware, teacherOnly, (req, res) => {
  const { displayName, username, password } = req.body;
  if (!displayName || !username) return res.status(400).json({ error: 'Nombre y usuario requeridos' });
  if (password) {
    const hash = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE teacher SET display_name=?, username=?, password=? WHERE id=1').run(displayName, username, hash);
  } else {
    db.prepare('UPDATE teacher SET display_name=?, username=? WHERE id=1').run(displayName, username);
  }
  res.json({ ok: true });
});

// ── Fallback → index.html ─────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`✓ KahootBoard corriendo en puerto ${PORT}`));

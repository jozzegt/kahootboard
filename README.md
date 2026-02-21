# KahootBoard 🎯

Portal de notas Kahoot para academia. Servidor Node.js + SQLite + frontend en una sola app.

## Estructura
```
kahootboard/
├── server.js          ← Servidor Express + SQLite
├── package.json
├── .gitignore
└── public/
    └── index.html     ← Frontend completo
```

## Despliegue en Railway

1. Sube este proyecto a un repositorio de GitHub
2. En Railway → New Project → Deploy from GitHub repo
3. Selecciona el repositorio
4. Railway detecta automáticamente Node.js y ejecuta `npm start`
5. En Settings → Networking → Generate Domain para obtener tu URL pública

## Variables de entorno (opcionales)
- `JWT_SECRET` — clave secreta para tokens (Railway la puede generar)
- `PORT` — Railway la asigna automáticamente

## Credenciales por defecto
- Maestro: `maestro` / `maestro123`
- Cámbialas desde el panel del maestro → Configuración

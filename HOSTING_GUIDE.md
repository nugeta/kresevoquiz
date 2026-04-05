# Školski Kviz - Upute za Hosting

## 📦 Što je MongoDB?
MongoDB je **besplatna** baza podataka. Imaš 2 opcije:
1. **Self-hosted** (na svom VPS-u) - potpuno besplatno, neograničeno
2. **MongoDB Atlas** - free tier s 512MB (dovoljno za 50,000+ pitanja)

---

## 🖥️ Hosting na Ubuntu VPS

### 1. Priprema servera
```bash
# Update sistema
sudo apt update && sudo apt upgrade -y

# Instaliraj potrebne alate
sudo apt install -y curl git nginx nodejs npm python3 python3-pip python3-venv
```

### 2. Instaliraj MongoDB (besplatno)
```bash
# Dodaj MongoDB repo
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Instaliraj
sudo apt update
sudo apt install -y mongodb-org

# Pokreni MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 3. Kloniraj projekt
```bash
cd /var/www
git clone <tvoj-repo-url> skolski-kviz
cd skolski-kviz
```

### 4. Setup Backend
```bash
cd /var/www/skolski-kviz/backend

# Kreiraj virtual environment
python3 -m venv venv
source venv/bin/activate

# Instaliraj dependencies
pip install -r requirements.txt

# Kreiraj .env datoteku
cat > .env << 'EOF'
MONGO_URL="mongodb://localhost:27017"
DB_NAME="skolski_kviz"
CORS_ORIGINS="*"
JWT_SECRET="tvoj-tajni-kljuc-promijeni-ovo-12345678901234567890"
ADMIN_EMAIL="admin@skola.hr"
ADMIN_PASSWORD="TvojaLozinka123!"
FRONTEND_URL="https://tvoja-domena.hr"
EOF
```

### 5. Setup Frontend
```bash
cd /var/www/skolski-kviz/frontend

# Instaliraj dependencies
npm install
# ili ako imaš yarn:
# yarn install

# Kreiraj .env
cat > .env << 'EOF'
REACT_APP_BACKEND_URL=https://tvoja-domena.hr
EOF

# Build za produkciju
npm run build
```

### 6. Nginx Konfiguracija
```bash
sudo cat > /etc/nginx/sites-available/skolski-kviz << 'EOF'
server {
    listen 80;
    server_name tvoja-domena.hr;

    # Frontend
    location / {
        root /var/www/skolski-kviz/frontend/build;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/skolski-kviz /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. Pokreni Backend (systemd)
```bash
sudo cat > /etc/systemd/system/skolski-kviz.service << 'EOF'
[Unit]
Description=Skolski Kviz Backend
After=network.target mongod.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/skolski-kviz/backend
Environment="PATH=/var/www/skolski-kviz/backend/venv/bin"
ExecStart=/var/www/skolski-kviz/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl start skolski-kviz
sudo systemctl enable skolski-kviz
```

### 8. SSL Certificate (HTTPS)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tvoja-domena.hr
```

---

## 🪟 Hosting na Windows Server

### 1. Instaliraj potrebne alate
- [Node.js](https://nodejs.org/) (LTS verzija)
- [Python 3.11+](https://www.python.org/downloads/)
- [MongoDB Community Server](https://www.mongodb.com/try/download/community)
- [Git](https://git-scm.com/)

### 2. Kloniraj i setup
```powershell
cd C:\inetpub
git clone <tvoj-repo-url> skolski-kviz
cd skolski-kviz\backend

# Python setup
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt

# Frontend
cd ..\frontend
npm install
npm run build
```

### 3. Pokreni kao Windows Service
Koristi [NSSM](https://nssm.cc/) za kreiranje Windows servisa:
```powershell
nssm install SkolskiKviz "C:\inetpub\skolski-kviz\backend\venv\Scripts\uvicorn.exe" "server:app --host 0.0.0.0 --port 8001"
nssm start SkolskiKviz
```

---

## 📝 Upravljanje Pitanjima i Kategorijama

### Admin Panel
1. Otvori `https://tvoja-domena.hr/admin`
2. Prijavi se s:
   - **Korisničko ime**: `admin`
   - **Lozinka**: `Admin123!` (ili što si postavio u .env)

### Dodavanje Kategorije
1. U Admin panelu klikni "Kategorije" tab
2. Klikni "Nova Kategorija"
3. Unesi:
   - Naziv (npr. "Geografija")
   - Opis
   - Odaberi boju
4. Spremi

### Dodavanje Pitanja
1. U Admin panelu klikni "Pitanja" tab
2. Klikni "Novo Pitanje"
3. Ispuni:
   - **Kategorija**: Odaberi iz liste
   - **Tip pitanja**:
     - Jedan odgovor (samo 1 točan)
     - Višestruki izbor (više točnih)
     - Točno/Netočno
   - **Tekst pitanja**
   - **Opcije**: Dodaj odgovore i označi točne (zelena kvačica)
   - **Bodovi**: 10-100
   - **Vrijeme**: 10-120 sekundi
4. Spremi

### Bulk Import (napredno)
Za masovno dodavanje pitanja, možeš koristiti MongoDB Compass ili API:
```bash
curl -X POST https://tvoja-domena.hr/api/questions \
  -H "Content-Type: application/json" \
  -H "Cookie: access_token=<tvoj-token>" \
  -d '{
    "category_id": "<id-kategorije>",
    "question_text": "Koji je glavni grad Francuske?",
    "question_type": "single_choice",
    "options": [
      {"id": "1", "text": "London", "is_correct": false},
      {"id": "2", "text": "Pariz", "is_correct": true},
      {"id": "3", "text": "Berlin", "is_correct": false}
    ],
    "points": 10,
    "time_limit": 30
  }'
```

---

## 🎨 Dark Mode
- Klikni na toggle (sunce/mjesec) u navigaciji
- Postavka se pamti u pregledniku

---

## 💾 Backup MongoDB
```bash
# Backup
mongodump --db skolski_kviz --out /backup/$(date +%Y%m%d)

# Restore
mongorestore --db skolski_kviz /backup/20260105/skolski_kviz
```

---

## 🔧 Troubleshooting

### Backend ne radi
```bash
sudo systemctl status skolski-kviz
sudo journalctl -u skolski-kviz -f
```

### MongoDB ne radi
```bash
sudo systemctl status mongod
sudo tail -f /var/log/mongodb/mongod.log
```

### Frontend pogreške
```bash
cd /var/www/skolski-kviz/frontend
npm run build 2>&1 | tail -50
```

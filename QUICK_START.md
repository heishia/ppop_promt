# ppop_promt Quick Start Guide

## First Time Setup

### 1. Generate Code Signing Certificate

Open PowerShell as Administrator:

```powershell
.\create-certificate.ps1
```

This creates `certificate.pfx` with password: `ppop_promt_cert_password_2025`

### 2. Setup Environment Variables

Copy the template:
```powershell
copy .env.template .env
```

Edit `.env` and add your GitHub token:
```env
CSC_KEY_PASSWORD=ppop_promt_cert_password_2025
GH_TOKEN=ghp_your_github_token_here
```

**Get GitHub Token:**
1. Go to: https://github.com/settings/tokens
2. Generate new token (classic)
3. Check `repo` permission
4. Copy token to `.env`

### 3. Install Dependencies

```bash
# Root project
npm install

# Frontend
cd frontend
npm install
cd ..

# Backend (optional for development)
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
```

### 4. Build for Production

Update version in `package.json`:
```json
{
  "version": "1.0.0"
}
```

Build and publish:
```bash
npm run build
```

This will:
1. Clean old builds
2. Build backend to EXE
3. Build frontend
4. Build Electron app with code signing
5. Upload to GitHub Releases

### 5. Test Locally (Without Publishing)

```bash
npm run build:local
```

---

## Development Mode

### Start Backend
```bash
python run.py prod
```

### Start Frontend
```bash
cd frontend
npm run dev
```

### Start Electron
```bash
npm run dev
```

---

## Version Updates

1. Update `package.json` version
2. Make your code changes
3. Run `npm run build`
4. Users will auto-download the update

---

## Troubleshooting

### Certificate Error
- Make sure `certificate.pfx` exists
- Check `CSC_KEY_PASSWORD` in `.env`
- Try: `npm run build:electron:unsigned`

### GitHub Upload Error
- Check `GH_TOKEN` in `.env`
- Verify token has `repo` permission
- Try local build: `npm run build:local`

### Windows SmartScreen Warning
- Normal with self-signed certificate
- Users: Click "More info" → "Run anyway"
- For production: Buy EV certificate from DigiCert/Sectigo

---

## Build Commands Reference

| Command | Description |
|---------|-------------|
| `npm run build` | Full build + publish to GitHub |
| `npm run build:local` | Full build without publishing |
| `npm run build:backend` | Build backend only |
| `npm run build:frontend` | Build frontend only |
| `npm run build:electron` | Build Electron + publish |
| `npm run build:electron:local` | Build Electron without publish |
| `npm run build:electron:unsigned` | Build without code signing |
| `npm run clean` | Clean build artifacts |
| `npm run dev` | Run in development mode |

---

## File Structure

```
ppop_promt/
├── .env                    # Your secrets (DO NOT COMMIT)
├── .env.template           # Template for .env
├── certificate.pfx         # Code signing cert (DO NOT COMMIT)
├── create-certificate.ps1  # Certificate generator
├── package.json            # Electron config + version
├── electron.js             # Main process
├── backend/                # Python FastAPI backend
├── frontend/               # React frontend
└── dist/                   # Built installers
    ├── ppop_promt Setup X.X.X.exe
    └── latest.yml
```

---

## Next Steps

1. Read [README.md](README.md) for detailed documentation
2. Read [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for deployment details
3. Start developing your features
4. Build and ship!

---

**Important Security Notes:**
- Never commit `.env` or `certificate.pfx`
- Rotate GitHub tokens every 6-12 months
- Use commercial EV certificate for production
- Review all code before building releases


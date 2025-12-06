# ppop_promt Deployment Guide

## Overview

This guide will help you build and deploy the ppop_promt desktop application with code signing and automatic updates.

## Prerequisites

- Node.js (v16 or higher)
- Python 3.8+
- PowerShell (for Windows certificate generation)
- GitHub account with repository access

---

## 1. Code Signing Setup

### Option A: Self-Signed Certificate (Testing Only)

**Note**: Self-signed certificates will still trigger Windows SmartScreen warnings. For production, use a commercial certificate.

1. Run the certificate generation script as Administrator:
   ```powershell
   .\create-certificate.ps1
   ```

2. The script will create `certificate.pfx` with password: `ppop_promt_cert_password_2025`

### Option B: Commercial Certificate (Production)

For production deployment, purchase an EV (Extended Validation) Code Signing Certificate from:
- DigiCert: https://www.digicert.com/code-signing
- Sectigo: https://sectigostore.com/code-signing
- GlobalSign: https://www.globalsign.com/en/code-signing-certificate

**Important**: EV certificates require a hardware token and are more expensive (~$300-500/year), but they eliminate SmartScreen warnings immediately.

---

## 2. GitHub Token Setup

### Create a Personal Access Token

1. Go to GitHub Settings: https://github.com/settings/tokens
2. Click "Generate new token" > "Generate new token (classic)"
3. Set the following:
   - **Name**: ppop_promt Auto-Update
   - **Expiration**: No expiration (or custom)
   - **Scopes**: Check `repo` (Full control of private repositories)
4. Click "Generate token"
5. **IMPORTANT**: Copy the token immediately (you won't be able to see it again)

### Configure Environment Variables

1. Copy the template file:
   ```powershell
   copy .env.template .env
   ```

2. Edit `.env` and replace the values:
   ```env
   CSC_KEY_PASSWORD=ppop_promt_cert_password_2025
   GH_TOKEN=ghp_your_actual_github_token_here
   ```

3. **NEVER commit the `.env` file** - it's already in `.gitignore`

---

## 3. Build Process

### First-Time Build

1. Install dependencies:
   ```bash
   npm install
   cd frontend && npm install && cd ..
   ```

2. Update version number in `package.json`:
   ```json
   {
     "version": "1.0.0"
   }
   ```

3. Build everything:
   ```bash
   npm run build
   ```

   This will:
   - Build the backend (Python → EXE)
   - Build the frontend (React → static files)
   - Build the Electron app (with code signing)
   - Publish to GitHub Releases

### Build Commands

- **Full build with publish**: `npm run build`
- **Build backend only**: `npm run build:backend`
- **Build frontend only**: `npm run build:frontend`
- **Build Electron only**: `npm run build:electron`
- **Local build (no publish)**: `npm run build:electron:clean`
- **Unsigned build**: `npm run build:electron:unsigned`

---

## 4. Version Updates

### Semantic Versioning

Follow semantic versioning: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes (e.g., 1.0.0 → 2.0.0)
- **MINOR**: New features (e.g., 1.0.0 → 1.1.0)
- **PATCH**: Bug fixes (e.g., 1.0.0 → 1.0.1)

### Update Process

1. Make your code changes
2. Update version in `package.json`:
   ```json
   {
     "version": "1.0.1"
   }
   ```

3. Build and publish:
   ```bash
   npm run build
   ```

4. The new version will be automatically uploaded to GitHub Releases
5. Users will be notified and can download the update automatically

---

## 5. Auto-Update System

### How It Works

1. The app checks GitHub Releases for new versions on startup
2. If a new version is found, users are prompted to download
3. The update downloads in the background
4. Users can install the update by restarting the app

### Configuration

Auto-update settings are in `electron.js`:
```javascript
autoUpdater.autoDownload = false; // User confirmation required
autoUpdater.autoInstallOnAppQuit = true; // Install on quit
```

### GitHub Release Requirements

- Releases must be in the repository: `heishia/ppop_promt`
- Files must be named: `ppop_promt Setup X.X.X.exe`
- `latest.yml` file must be included (auto-generated)

---

## 6. Window Configuration

### Default Settings

- **Aspect Ratio**: 6:4 (width:height = 1.5:1)
- **Initial Size**: 50% of screen width, maintaining aspect ratio
- **Minimum Size**: 800x533 pixels (prevents UI breaking)
- **Resizable**: Yes (users can adjust freely after initial sizing)

### Development vs Production

- **Development Mode**: No size restrictions (for debugging)
- **Production Mode**: Minimum size enforced

---

## 7. Distribution

### First Installation

Users will need to:
1. Download `ppop_promt Setup X.X.X.exe` from GitHub Releases
2. Run the installer
3. If using self-signed certificate, bypass SmartScreen warning:
   - Click "More info" → "Run anyway"

### Subsequent Updates

- The app will notify users of updates
- Users click "Download" to get the update
- After download, users restart to install

---

## 8. Troubleshooting

### Certificate Issues

**Problem**: "Windows protected your PC" warning

**Solution**:
- Self-signed certificate: Users must click "More info" → "Run anyway"
- Commercial certificate: Purchase EV certificate to eliminate warning

### Build Failures

**Problem**: Build fails with signing error

**Solutions**:
1. Verify `certificate.pfx` exists in the project root
2. Check `.env` file has correct `CSC_KEY_PASSWORD`
3. Try unsigned build: `npm run build:electron:unsigned`

### Update Failures

**Problem**: Auto-update not working

**Solutions**:
1. Verify `GH_TOKEN` in `.env` has `repo` permissions
2. Check GitHub Releases exist at `heishia/ppop_promt`
3. Verify `latest.yml` is uploaded to releases
4. Check app is running in packaged mode (not dev mode)

### Backend Port Conflicts

**Problem**: Backend fails to start (port in use)

**Solution**: The backend automatically finds an available port (8000-8100)

---

## 9. Security Best Practices

1. **Never commit**:
   - `.env` file
   - `certificate.pfx`
   - GitHub tokens

2. **Rotate tokens** periodically (every 6-12 months)

3. **Use EV certificates** for production to build reputation with Microsoft SmartScreen

4. **Code review** all changes before building releases

---

## 10. File Structure

```
ppop_promt/
├── backend/                # Python backend
│   ├── main.py
│   ├── build_backend.py    # Backend build script
│   └── dist/               # Built backend exe
├── frontend/               # React frontend
│   ├── src/
│   └── dist/               # Built frontend
├── electron.js             # Electron main process
├── preload.js              # Electron preload script
├── package.json            # Build configuration
├── .env                    # Environment variables (DO NOT COMMIT)
├── .env.template           # Template for .env
├── certificate.pfx         # Code signing cert (DO NOT COMMIT)
├── create-certificate.ps1  # Certificate generation script
└── dist/                   # Final builds
    ├── ppop_promt Setup X.X.X.exe
    └── latest.yml
```

---

## Support

For issues or questions:
- GitHub Issues: https://github.com/heishia/ppop_promt/issues
- Repository: https://github.com/heishia/ppop_promt

---

## License

MIT License - See LICENSE file for details


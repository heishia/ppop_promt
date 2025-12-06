# ppop_promt Build & Deployment Checklist

## Pre-Build Setup (First Time Only)

### Step 1: Generate Certificate
- [ ] Open PowerShell as Administrator
- [ ] Run: `.\create-certificate.ps1`
- [ ] Verify `certificate.pfx` file created
- [ ] Note password: `ppop_promt_cert_password_2025`

### Step 2: Create Environment File
- [ ] Copy template: `copy .env.template .env`
- [ ] Open `.env` file
- [ ] Set `CSC_KEY_PASSWORD=ppop_promt_cert_password_2025`
- [ ] Get GitHub Token from: https://github.com/settings/tokens
- [ ] Set `GH_TOKEN=` with your token (needs `repo` permission)
- [ ] Save `.env` file
- [ ] Verify `.env` is in `.gitignore` (already done)

### Step 3: Install Dependencies
- [ ] Root: `npm install`
- [ ] Frontend: `cd frontend && npm install && cd ..`
- [ ] Backend (optional): `python -m venv venv` and install requirements

---

## Before Every Build

### Version Management
- [ ] Open `package.json`
- [ ] Update `version` field (e.g., "1.0.1")
- [ ] Follow semantic versioning: MAJOR.MINOR.PATCH
- [ ] Commit version change to git

### Code Quality
- [ ] Test backend: `python run.py prod`
- [ ] Test frontend: `cd frontend && npm run dev`
- [ ] Test Electron: `npm run dev`
- [ ] Verify all features working
- [ ] Check for console errors

### Pre-Build Verification
- [ ] Certificate exists: `certificate.pfx`
- [ ] Environment configured: `.env` has both tokens
- [ ] GitHub token valid (not expired)
- [ ] Disk space available (>500MB)
- [ ] No other builds running

---

## Build Process

### Option A: Local Test Build (Recommended First)
```bash
npm run build:local
```
- [ ] Watch build output for errors
- [ ] Check `dist/` folder for installer
- [ ] Test install locally
- [ ] Verify app launches
- [ ] Verify window size (6:4 ratio)
- [ ] Check minimum size (800x533)
- [ ] Test all features

### Option B: Production Build with Publish
```bash
npm run build
```
- [ ] Watch build output for errors
- [ ] Wait for GitHub upload to complete
- [ ] Check GitHub Releases page
- [ ] Verify installer uploaded
- [ ] Verify `latest.yml` uploaded
- [ ] Download from GitHub and test

---

## Post-Build Verification

### File Verification
- [ ] `dist/ppop_promt Setup X.X.X.exe` exists
- [ ] `dist/latest.yml` exists
- [ ] File sizes reasonable (exe ~200-400MB)
- [ ] `resources/ppop_promt_backend.exe` exists

### Installation Test (Clean Machine Recommended)
- [ ] Download installer
- [ ] Run installer
- [ ] Handle SmartScreen warning (self-signed cert)
  - Click "More info"
  - Click "Run anyway"
- [ ] Complete installation
- [ ] Launch app
- [ ] Verify window size correct
- [ ] Test all core features
- [ ] Check backend connectivity

### Window Size Tests
- [ ] Test on 1920x1080 screen
- [ ] Test on 1366x768 screen
- [ ] Test on 4K screen (if available)
- [ ] Verify 6:4 aspect ratio maintained
- [ ] Test resizing window
- [ ] Verify minimum size (800x533)
- [ ] Check UI doesn't break at minimum size

### Auto-Update Test (After Second Release)
- [ ] Install old version
- [ ] Release new version
- [ ] Launch old version
- [ ] Wait for update notification
- [ ] Click "Download"
- [ ] Verify download progress
- [ ] Restart app
- [ ] Verify new version installed

---

## Troubleshooting

### Build Fails - Certificate Error
```
Cannot sign app: certificate not found
```
**Solution:**
- [ ] Verify `certificate.pfx` exists
- [ ] Check `.env` has `CSC_KEY_PASSWORD`
- [ ] Try: `npm run build:electron:unsigned`

### Build Fails - GitHub Upload Error
```
GitHub release upload failed
```
**Solution:**
- [ ] Check `.env` has `GH_TOKEN`
- [ ] Verify token has `repo` permission
- [ ] Check token not expired
- [ ] Try: `npm run build:local` (skip upload)

### SmartScreen Warning
```
Windows protected your PC
```
**This is NORMAL with self-signed certificate**
- [ ] User: Click "More info"
- [ ] User: Click "Run anyway"
- [ ] For production: Buy commercial EV certificate

### Window Size Issues
```
Window too small or wrong ratio
```
**Solution:**
- [ ] Check screen resolution
- [ ] Verify minimum 800x533 support
- [ ] Check electron.js changes applied
- [ ] Restart app

---

## Release Checklist

### Before Publishing
- [ ] All features tested
- [ ] No known critical bugs
- [ ] Version number updated
- [ ] Release notes prepared
- [ ] Screenshots updated (if needed)

### Publishing
- [ ] Run: `npm run build`
- [ ] Wait for completion
- [ ] Verify GitHub Release created
- [ ] Add release notes to GitHub
- [ ] Mark as latest release
- [ ] Notify users (if applicable)

### After Publishing
- [ ] Test download link works
- [ ] Install on clean machine
- [ ] Verify auto-update works
- [ ] Monitor for user issues
- [ ] Update documentation if needed

---

## Emergency Rollback

If critical bug found after release:

1. [ ] Go to GitHub Releases
2. [ ] Find problematic release
3. [ ] Edit release → Uncheck "Latest release"
4. [ ] Mark previous good release as latest
5. [ ] Users will revert on next update
6. [ ] Fix bug and release new version

---

## Maintenance Schedule

### Weekly
- [ ] Check for user-reported issues
- [ ] Monitor GitHub Issues

### Monthly
- [ ] Review build logs
- [ ] Check for dependency updates
- [ ] Test auto-update flow

### Every 6 Months
- [ ] Rotate GitHub token
- [ ] Review certificate expiration
- [ ] Update dependencies
- [ ] Security audit

---

## Quick Reference

### Build Commands
| Command | Use Case |
|---------|----------|
| `npm run build` | Production build + GitHub publish |
| `npm run build:local` | Local test build (no publish) |
| `npm run build:electron:unsigned` | Build without code signing |
| `npm run clean` | Clean old builds |

### File Locations
- Certificate: `./certificate.pfx`
- Environment: `./.env`
- Build output: `./dist/`
- Backend exe: `./resources/ppop_promt_backend.exe`
- Frontend: `./frontend/dist/`

### Important Links
- GitHub Releases: https://github.com/heishia/ppop_promt/releases
- GitHub Tokens: https://github.com/settings/tokens
- Deployment Guide: `DEPLOYMENT_GUIDE.md`
- Quick Start: `QUICK_START.md`

---

## Notes

- ✅ All certificate files in `.gitignore`
- ✅ All secrets in `.env` (not committed)
- ✅ Self-signed cert will show SmartScreen warning
- ✅ Window maintains 6:4 ratio on all screens
- ✅ Minimum size prevents UI breaking
- ⚠️ First install requires manual download
- ⚠️ Commercial EV cert recommended for production

---

**Last Updated**: December 6, 2025
**Status**: Ready for use


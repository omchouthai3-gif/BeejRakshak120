# Build BeejRakshak APK with GitHub Actions

Publish-ready build (no demo packets, no sample alerts).

## 1. Create a GitHub repository

1. https://github.com/new
2. Name e.g. `beejrakshak`
3. Public or Private
4. **Do not** add README / license (this package already has them)
5. Create repository

## 2. Upload this project

**Website:** repo → *uploading an existing file* → drag all files from the unzipped folder → Commit.

**CLI:**
```bash
unzip beejrakshak-publish-ready.zip
cd beejrakshak-publish-ready   # or the folder name after unzip
git init
git add .
git commit -m "BeejRakshak publish-ready"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/beejrakshak.git
git push -u origin main
```

## 3. Run the workflow

1. **Actions** tab → **Build BeejRakshak Release APK**
2. **Run workflow** → **Run workflow**
3. Wait until green (about 5–12 minutes)
4. Open the run → **Artifacts** → download **BeejRakshak-debug**
5. Unzip → install `app-debug.apk` on the phone

## 4. Optional: production Gemini key

**Settings → Secrets and variables → Actions → New repository secret**

| Name | Value |
|------|--------|
| `GEMINI_API_KEY` | your Gemini API key |

Then in `.github/workflows/build-apk.yml`, under the Vite build step, set:

```yaml
env:
  GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
```

For a live backend from the APK, also set:

```yaml
VITE_API_BASE_URL: https://your-api.example.com
```

## Notes

- Debug APK is fine for field testing. For Play Store, generate a signed release in Android Studio after `npm run cap:sync`.
- Camera + Location must be granted on the device.
- Offline QR + registry verification works without any API key.

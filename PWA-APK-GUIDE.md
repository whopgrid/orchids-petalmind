# PetalMind PWA to APK Guide

## 🎯 Overview
Your PetalMind app is now configured as a Progressive Web App (PWA) with security protections against code extraction and debugging.

## 🔒 Security Features Implemented

### 1. **Anti-Debugging Protection**
- Disables right-click context menu
- Blocks F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U keyboard shortcuts
- Detects and blocks DevTools opening
- Anti-debugger breakpoint detection
- Disables console logging in production
- Prevents text selection and copying

### 2. **Code Obfuscation**
- Service worker caching to reduce code exposure
- Runtime protection against code inspection
- Automatic redirect when debugging is detected

### 3. **PWA Configuration**
- Offline caching enabled
- Network-first strategy for API calls
- Automatic service worker registration
- Standalone app mode (no browser UI)

## 📱 How to Generate APK File

### Option 1: Using TWA (Trusted Web Activity) - Recommended

1. **Install Bubblewrap CLI**
   ```bash
   npm install -g @bubblewrap/cli
   ```

2. **Initialize TWA Project**
   ```bash
   bubblewrap init --manifest https://your-domain.com/manifest.json
   ```
   
   Fill in the prompts:
   - App name: PetalMind
   - Package name: com.petalmind.app
   - Host: your-domain.com
   - Start URL: /

3. **Build APK**
   ```bash
   bubblewrap build
   ```

4. **Sign APK** (for production)
   ```bash
   bubblewrap build --release
   ```

### Option 2: Using PWABuilder.com (Easiest)

1. Visit [PWABuilder.com](https://www.pwabuilder.com/)
2. Enter your deployed app URL (e.g., https://your-domain.com)
3. Click "Package For Stores"
4. Select "Android" and download the package
5. Follow instructions to sign and publish

### Option 3: Using Android Studio

1. **Deploy Your App**
   - Deploy your Next.js app to a hosting service (Vercel, Netlify, etc.)
   - Ensure HTTPS is enabled

2. **Create TWA Project in Android Studio**
   - Open Android Studio
   - File > New > Project > Trusted Web Activity
   - Enter your app URL and package details

3. **Configure Digital Asset Links**
   - Add `assetlinks.json` to your domain's `.well-known` folder
   - Verify ownership with Google

4. **Build APK**
   - Build > Generate Signed Bundle / APK
   - Follow wizard to create keystore and sign

### Option 4: Using Capacitor (Advanced)

1. **Install Capacitor**
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/android
   npx cap init
   ```

2. **Add Android Platform**
   ```bash
   npx cap add android
   ```

3. **Build and Sync**
   ```bash
   npm run build
   npx cap sync
   npx cap open android
   ```

4. **Generate APK in Android Studio**
   - Build > Build Bundle(s) / APK(s) > Build APK(s)

## 🚀 Deployment Checklist

### Before Building APK:

1. **Deploy to Production**
   ```bash
   npm run build
   # Deploy to your hosting service
   ```

2. **Verify PWA**
   - Open Chrome DevTools
   - Go to Lighthouse tab
   - Run PWA audit (should score 90+)

3. **Test Installation**
   - Visit your site on mobile
   - Chrome should show "Add to Home Screen" prompt
   - Install and test offline functionality

4. **Update manifest.json**
   - Ensure all URLs are absolute (https://your-domain.com)
   - Update icon URLs to hosted versions
   - Verify theme colors

### Security Verification:

- [ ] Test that right-click is disabled
- [ ] Verify F12 is blocked
- [ ] Check that DevTools detection works
- [ ] Confirm console is disabled in production
- [ ] Test text selection is prevented

## 📋 Production Environment Variables

Ensure these are set for production:

```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## 🔑 Digital Asset Links (for TWA)

Create `.well-known/assetlinks.json` in your public folder:

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.petalmind.app",
    "sha256_cert_fingerprints": ["YOUR_CERT_FINGERPRINT"]
  }
}]
```

Get your certificate fingerprint:
```bash
keytool -list -v -keystore my-release-key.keystore
```

## 🛡️ Additional Security Recommendations

1. **Code Minification**: Already enabled with Next.js production build
2. **Environment Variables**: Never expose API keys in client code
3. **HTTPS Only**: Always use HTTPS in production
4. **Content Security Policy**: Consider adding CSP headers
5. **Rate Limiting**: Implement API rate limiting

## 📱 Testing APK

1. **Enable Developer Mode** on Android device
2. **Install APK** via ADB or file transfer:
   ```bash
   adb install app-release.apk
   ```
3. **Test all features** including offline mode
4. **Verify security protections** are working

## 🎉 Publishing to Google Play Store

1. **Create Developer Account** ($25 one-time fee)
2. **Prepare Store Listing**
   - App screenshots (minimum 2)
   - Feature graphic (1024 x 500)
   - App icon (512 x 512)
   - Description and details

3. **Upload APK/AAB**
   - Google Play Console > All apps > Create app
   - Upload signed APK or Android App Bundle (AAB)
   - Complete content rating questionnaire
   - Set pricing and distribution

4. **Review and Publish**
   - Submit for review
   - Wait for approval (usually 1-3 days)

## 🔄 Updates

To update your APK:
1. Increment version in `manifest.json`
2. Rebuild APK with new version
3. Upload to Play Store as update

## ⚠️ Important Notes

- **Security is not 100%**: Determined users can still extract code, but these measures significantly increase difficulty
- **Test thoroughly**: Always test APK on real devices before publishing
- **Keep secrets server-side**: Never embed sensitive data in client code
- **Monitor performance**: PWA features may impact initial load time
- **Update regularly**: Keep dependencies and security measures updated

## 📞 Support

If you encounter issues:
1. Check browser console (in development mode only)
2. Verify manifest.json is valid
3. Test service worker registration
4. Ensure HTTPS is properly configured
5. Check Android logcat for TWA issues

---

**Your app is now ready to be converted to APK!** 🎊

Start by deploying to production, then follow Option 2 (PWABuilder) for the easiest APK generation process.
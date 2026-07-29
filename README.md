# Magic Music

This repository contains the Magic Music front-end (React + Vite) for playing background music during magic shows and a simple admin panel to upload and manage tracks using Cloudinary and Firebase.

Important: Do NOT hardcode secrets. This repo uses environment variables. Fill them locally before running.

.env.example (copy to .env.local and edit):

VITE_FIREBASE_API_KEY=AIzaSyAa_ZVk_m6aXXm8ygCKNd0EQtaQZDMnBrg
VITE_FIREBASE_AUTH_DOMAIN=music-site-d1baf.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=music-site-d1baf
VITE_FIREBASE_APP_ID=1:813329988297:web:79347fd497edb8a5562b18

# Provided values (placeholders only)
VITE_CLOUDINARY_CLOUD_NAME=u3elvi6g
VITE_CLOUDINARY_UPLOAD_PRESET=magician_unsigned
VITE_OPERATOR_PASSWORD=Music@123
VITE_ADMIN_EMAIL=bhuvanbhaskar924@gmail.com


Quick setup

1. Install dependencies

   npm install

2. Create a Firebase project (console.firebase.google.com)
   - Enable Authentication (Email/Password)
   - Create Firestore database
   - Add a Web app in Project settings and copy the config
   - Use the firebase config values to fill the VITE_FIREBASE_* vars in .env.local
   - Create an admin user in Firebase Console > Authentication > Add user using the admin email above and a password

3. Create a Cloudinary account (cloudinary.com)
   - Note your cloud name (u3elvi6g) is prefilled in the example
   - Create an unsigned upload preset (Settings → Upload → Upload presets → Add upload preset) and set Signing mode to "Unsigned"
   - Put the preset name into VITE_CLOUDINARY_UPLOAD_PRESET

4. Run locally

   cp .env.example .env.local
   # edit .env.local if needed
   npm run dev

5. Deploy to Firebase Hosting (optional)
   - Install Firebase CLI: npm install -g firebase-tools
   - firebase login
   - firebase init hosting (select your project)
   - npm run build
   - firebase deploy --only hosting

Notes & limitations

- Cloudinary uploads use an unsigned preset from the frontend. Uploaded files will be stored in your Cloudinary account.
- Deleting a track in the admin panel removes the Firestore entry but does not automatically delete the Cloudinary asset (deleting assets from Cloudinary requires API key/secret). You can delete assets manually from the Cloudinary console.
- The site includes best-effort protections against casual downloads and recording (disable right-click, pause on visibility change, short session unlock), but it is not possible to guarantee 100% protection on the web.

If you need help filling .env.local or deploying, tell me and I'll guide step-by-step.

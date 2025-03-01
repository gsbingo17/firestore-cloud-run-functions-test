const admin = require('firebase-admin');

// Initialize Firebase Admin
const app = admin.initializeApp({
  // In production, credentials will be automatically provided when deployed to Cloud Run
  // For local development, you'll need to set GOOGLE_APPLICATION_CREDENTIALS
  credential: admin.credential.applicationDefault()
});

const db = admin.firestore();

module.exports = {
  db,
  admin
};

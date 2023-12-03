// generate-config.js
const fs = require('fs');


if (process.env.NODE_ENV == 'development') {
    const dotenv = require('dotenv');
    // Load environment variables from .env file
    dotenv.config();
} else {
    // Load environment variables from Netlify environment during deployment
    // Note: Netlify automatically injects environment variables during deployment
}


const config = `
const firebaseConfig = {
    apiKey: "${process.env.FIREBASE_API_KEY}",
    databaseURL: "${process.env.FIREBASE_DATABASE_URL}",
    authDomain: "${process.env.FIREBASE_AUTH_DOMAIN}",
    projectId: "${process.env.FIREBASE_PROJECT_ID}",
    storageBucket: "${process.env.FIREBASE_STORAGE_BUCKET}",
    messagingSenderId: "${process.env.FIREBASE_MESSAGING_SENDER_ID}",
    appId: "${process.env.FIREBASE_APP_ID}",
    measurementId: "${process.env.FIREBASE_MEASUREMENT_ID}"
};
`;

fs.writeFileSync('sketch/firebaseConfig.ts', config);

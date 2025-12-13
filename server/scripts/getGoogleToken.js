/**
 * One-time script to get Google OAuth2 refresh token
 * Run: node scripts/getGoogleToken.js
 */
import { google } from 'googleapis';
import http from 'http';
import url from 'url';
import open from 'open';
import dotenv from 'dotenv';

dotenv.config();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3333/callback';
const SCOPES = ['https://www.googleapis.com/auth/drive'];

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Error: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env');
  console.log('\n📋 Steps to get these:');
  console.log('1. Go to https://console.cloud.google.com');
  console.log('2. Select your project (edu-9090)');
  console.log('3. Go to APIs & Services → Credentials');
  console.log('4. Click "Create Credentials" → "OAuth client ID"');
  console.log('5. Choose "Desktop app"');
  console.log('6. Copy Client ID and Client Secret to .env');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// Generate auth URL
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent'
});

// Create temporary server to handle callback
const server = http.createServer(async (req, res) => {
  const queryParams = url.parse(req.url, true).query;
  
  if (queryParams.code) {
    try {
      const { tokens } = await oauth2Client.getToken(queryParams.code);
      
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <body style="font-family: Arial; padding: 40px; text-align: center;">
            <h1>✅ Success!</h1>
            <p>Add this to your <strong>.env</strong> file:</p>
            <div style="background: #f0f0f0; padding: 20px; border-radius: 8px; margin: 20px; text-align: left;">
              <code>GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}</code>
            </div>
            <p>Then restart your server.</p>
          </body>
        </html>
      `);
      
      console.log('\n✅ SUCCESS! Add this to your .env file:\n');
      console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
      console.log('\nThen restart your server with: npm start');
      
      server.close();
      process.exit(0);
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end(`<h1>Error: ${error.message}</h1>`);
      console.error('Error:', error);
    }
  }
});

server.listen(3333, () => {
  console.log('\n🔗 Opening browser for Google login...\n');
  console.log('If browser does not open, visit this URL manually:');
  console.log(authUrl);
  open(authUrl);
});

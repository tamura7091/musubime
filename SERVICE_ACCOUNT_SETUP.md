# 🔐 Service Account Setup for Google Sheets

## Your Service Account
- **Email:** `naokitamura@calm-cove-426904-s8.iam.gserviceaccount.com`

## Setup Steps

### 1. Get the Private Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "IAM & Admin" → "Service Accounts"
3. Find your service account: `naokitamura@calm-cove-426904-s8.iam.gserviceaccount.com`
4. Click "Actions" → "Manage keys"
5. Click "Add Key" → "Create new key" → "JSON"
6. Download the JSON file

### 2. Extract Credentials
From the downloaded JSON file, extract:
- `client_email` (should be your service account email)
- `private_key` (the long string starting with -----BEGIN PRIVATE KEY-----)

### 3. Update .env.local
```bash
# Google Sheets Service Account Configuration
GOOGLE_SHEETS_SPREADSHEET_ID=1OCVA_z4FFLGGg8jCRKqla5AMHZLkGMdIpzmizetDPNI
GOOGLE_SERVICE_ACCOUNT_EMAIL=naokitamura@calm-cove-426904-s8.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"
GOOGLE_SHEETS_RANGE=campaigns!A:Z
```

### 4. Share the Google Sheet
1. Open your [Google Sheet](https://docs.google.com/spreadsheets/d/1OCVA_z4FFLGGg8jCRKqla5AMHZLkGMdIpzmizetDPNI/edit)
2. Click "Share" (top right)
3. Add: `naokitamura@calm-cove-426904-s8.iam.gserviceaccount.com`
4. Set permission to "Viewer"
5. Click "Send"

### 5. Enable Google Sheets API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" → "Library"
3. Search for "Google Sheets API"
4. Click on it and click "Enable"

### 6. Test the Setup
```bash
# Restart your dev server
npm run dev

# Test the API
curl -s http://localhost:3000/api/campaigns | head -100

# Test login with sheet data
curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"id":"YOUR_CAMPAIGN_ID","password":"YOUR_PASSWORD"}'
```

## Benefits of Service Account vs API Key
✅ **Private Data** - Sheet doesn't need to be public  
✅ **More Secure** - No API key in environment  
✅ **Better Control** - Specific permissions per service account  
✅ **Production Ready** - Recommended for production use  

## Troubleshooting
- **403 Error:** Service account not shared with the sheet
- **401 Error:** Invalid private key format
- **404 Error:** Wrong spreadsheet ID or sheet name
- **Check Console:** Look for debug logs with 🔑 and 📊 emojis

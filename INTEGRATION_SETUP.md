# Kaiju No. 69 Integration Setup Guide

## 🚀 Quick Start

This guide will help you get the complete Kaiju No. 69 platform running with the new integrations.

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL (via Supabase)
- An Alchemy API key for Shape Sepolia RPC

## 🔧 Setup Steps

### 1. Backend Service (kaiju-service)

```bash
cd kaiju-service
npm install

# The .env file is already configured with:
# - Supabase credentials (ready to use)
# - JWT secret (change in production)
# - You need to add your Alchemy API key for SHAPE_SEPOLIA_RPC_URL

# Start the backend
npm run dev
```

The backend will run on `http://localhost:3000`

### 2. Trading Algorithm

```bash
cd ../trading-algorithm
npm install

# The .env file is configured with:
# - Gemini AI API key (ready to use)
# - You need to:
#   1. Create a Kaiju via the UI first
#   2. Add the KAIJU_ID from Supabase
#   3. Generate an ALGORITHM_KEY

# Start the trading algorithm
npm run dev
```

The algorithm will run on `http://localhost:3001`

### 3. Frontend

```bash
cd ../frontend
npm install

# The .env.local file needs:
# - Supabase anon key (get from Supabase dashboard)
# - WalletConnect project ID
# - Alchemy API key

# Start the frontend
npm run dev
```

The frontend will run on `http://localhost:3000` (Next.js default)

## 🔑 Important Credentials

### Supabase
- **URL**: `https://qrsdodlbzjghfxoppcsp.supabase.co`
- **Service Key**: Already in `.env` files (keep secure!)
- **Anon Key**: Get from Supabase dashboard → Settings → API

### Gemini AI
- **API Key**: `AIzaSyCk1Ii4OZE8fYZfHtEm_W8Jd9Gp9YtU5hU`
- **Model**: `gemini-2.0-flash-exp`

## 📊 Database Schema

The database schema has been created in Supabase with these tables:
- `kaiju_no_69_users` - User accounts with server wallets
- `kaiju_no_69_kaijus` - Trading algorithms with image URLs
- `kaiju_no_69_shadows` - User-Kaiju relationships
- `kaiju_no_69_trades` - Trade signals
- `kaiju_no_69_shadow_positions` - Individual positions

## 🎯 Testing the Integration

1. **Start all services** in this order:
   - Backend (port 3000)
   - Trading Algorithm (port 3001)
   - Frontend (port 3000 or next available)

2. **Test the marketplace**:
   - Navigate to `/marketplace`
   - You should see real data from the backend
   - If no Kaijus exist, it will show an empty state

3. **Create a test Kaiju**:
   - Use the `/create-kaiju` page
   - Note: You'll need to implement image generation for `kaiju_image_url` and `shadow_image_url`

4. **Test trading algorithm**:
   - Run the Kaiju strategy runner: `npm run dev` in trading-algorithm
   - It will post trades to the backend
   - Shadows will automatically copy trades

## 🔍 Troubleshooting

### "Failed to load Kaijus"
- Check if backend is running on port 3000
- Verify Supabase credentials are correct
- Check browser console for CORS errors

### Trading algorithm errors
- Ensure KAIJU_ID and ALGORITHM_KEY are set
- Check that the backend is accessible
- Verify Gemini API key is working

### Database errors
- Ensure all tables were created in Supabase
- Check RLS policies are not blocking access
- Verify service role key has proper permissions

## 📝 Next Steps

1. **Configure wallet encryption key**: Generate a secure 32-character key for `WALLET_ENCRYPTION_KEY`
2. **Add Alchemy API key**: Get from Alchemy dashboard for Shape Sepolia
3. **Implement image generation**: Add AI image generation for Kaiju/Shadow avatars
4. **Deploy to production**: Update all credentials and URLs

## 🔒 Security Notes

- Never commit `.env` files with real credentials
- Change all default keys in production
- Use environment variables for all sensitive data
- Enable RLS policies in Supabase for production

## 📚 API Changes

### Gemini AI Integration
- Replaced Claude API with Gemini 2.0 Flash Exp
- Uses temperature 0.3 for consistent trading decisions
- Supports same prompt format as before

### Backend Updates
- Added `kaiju_image_url` and `shadow_image_url` to Kaiju model
- API transforms backend data to frontend format
- Supports filtering and pagination

### Frontend Updates
- Marketplace now fetches real data from backend
- Falls back to mock data if API fails
- Shows loading and error states

---

For more details, check the main README.md file.
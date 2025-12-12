# Mobile QR Code Testing Setup Guide

## Problem
When testing the invite code QR scanning feature on mobile devices (iPad, iPhone, Android), the QR codes point to `http://localhost:8080` which doesn't work because:
- Mobile devices are on a different machine
- They can't access `localhost` (which refers to their own device)
- The dev server is running on your machine, not the phone

## Solution
Use your machine's network IP address instead of `localhost`.

## Step 1: Find Your Network IP
When you run `npm run dev`, Vite shows two URLs:

```
VITE v5.4.10 ready in 176 ms

➜  Local:   http://localhost:8080/
➜  Network: http://192.168.0.158:8080/
```

The **Network** URL is what you need for mobile testing. In this example: `192.168.0.158:8080`

## Step 2: Configure the Environment Variable
Open `.env` and set:
```
VITE_NETWORK_URL="http://192.168.0.158:8080"
```

Replace `192.168.0.158` with your actual network IP.

## Step 3: Restart Dev Server
```bash
npm run dev
```

The dev server will hot-reload your changes. You don't need to rebuild anything.

## Step 4: Test on Mobile
1. Make sure your mobile device is connected to the **same WiFi network**
2. Open Safari (or any browser) on the mobile device
3. Go to: `http://192.168.0.158:8080`
4. Login and navigate to the vendor dashboard
5. Generate a QR code in the "Invite Codes" section
6. Scan the QR code on the **same mobile device**
7. It should open the connect page on mobile

## Troubleshooting

**"Can't connect to the server"**
- Verify you're on the same WiFi network as your machine
- Check your firewall allows port 8080
- Make sure `npm run dev` is still running
- Use the correct network IP (from Vite output)

**"localhost:8080 still shows in QR code"**
- Update the `VITE_NETWORK_URL` in `.env`
- Save the file
- Hard refresh the browser (Cmd+Shift+R on Mac)
- Regenerate the QR code

**QR code works on one mobile device but not another**
- Both devices must be on the same WiFi network
- Check if there are network restrictions between devices

## How It Works
The `urlUtils.ts` file automatically:
1. Detects if you're running on `localhost`
2. Reads the `VITE_NETWORK_URL` environment variable
3. Uses the network URL for shareable links instead of localhost
4. QR codes now contain the network URL instead of localhost
5. Mobile devices can scan and access the link

## Environment Variables
| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_NETWORK_URL` | Network IP for mobile testing | `http://192.168.0.158:8080` |
| `VITE_SUPABASE_URL` | Supabase backend (unchanged) | https://ssaogbrpjvxvlxtdivah.supabase.co |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Auth key (unchanged) | (see .env file) |

## Production Deployment
When deploying to production:
- Remove or leave `VITE_NETWORK_URL` empty
- The system will automatically use your production domain
- QR codes will point to your production URL

## For Testing with Multiple Devices
You can test with:
- ✅ Desktop Safari/Chrome → http://192.168.0.158:8080
- ✅ iPad Safari → http://192.168.0.158:8080  
- ✅ iPhone Safari → http://192.168.0.158:8080
- ✅ Android Chrome → http://192.168.0.158:8080

All should work with the same network IP configuration.

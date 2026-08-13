# Tarot AI Proxy

A lightweight local web app for pulling a tarot card and generating a reading through the Volcano Engine Ark DeepSeek API. The key idea is simple: the API key stays on the server, while the browser only talks to a same-origin endpoint.

This project is designed to be easy to run locally and easy to deploy publicly on Render, so you can share the app with friends without exposing your secret key in the browser.

## Features

- Tarot card draw UI
- Same-origin AI endpoint: `/api/reading`
- Server-side API key handling
- Local development ready
- Render deployment ready
- Public share-friendly architecture

## Project Structure

```bash
.
├── api.js
├── app.js
├── data.js
├── index.html
├── package.json
├── server.js
├── styles.css
├── .env.example
├── .gitignore
├── README.md
└── README.zh.md
```

## Local Setup

1. Create your local environment file:

```bash
cp .env.example .env
```

2. Fill in your real key in `.env`:

```bash
ARK_API_KEY=your_volcengine_ark_key_here
PORT=8787
```

3. Install dependencies:

```bash
npm install
```

4. Start the app:

```bash
npm start
```

5. Open the app:

```text
http://localhost:8787
```

## Environment Variables

The app reads these values from the environment:

```bash
ARK_API_KEY=your_volcengine_ark_key_here
PORT=8787
```

Keep the key in the server environment only. Do not place it in frontend JavaScript or public config files.

## Deploy to Render

### 1. Push the project to GitHub

```bash
git init
git add .
git commit -m "Deploy-ready tarot app"
git branch -M main
git remote add origin git@github.com:YOUR_GITHUB_USER/tarot-ai-proxy.git
git push -u origin main
```

If you already have a repository, use your existing remote instead.

### 2. Create a Render Web Service

1. Go to https://dashboard.render.com
2. Click New → Web Service
3. Connect your GitHub repo
4. Use these settings:

Build Command:

```bash
npm install
```

Start Command:

```bash
npm start
```

### 3. Add environment variables in Render

Add these values in the Render dashboard:

```bash
ARK_API_KEY=your_volcengine_ark_key_here
NODE_ENV=production
PORT=10000
```

### 4. Deploy

Click Deploy. Render will give you a public HTTPS link once the service is live.

Example:

```text
https://tarot-ai-proxy.onrender.com
```

## Security Notes

- Keep your API key in the server environment only
- Never commit `.env` to Git
- Never expose the key in frontend code
- The app intentionally uses a backend API route so the browser never sees the secret key

## Notes for Sharing

This app is ready to be shared publicly as a simple web app. Friends can open the Render URL and use the tarot reading feature without needing your local terminal or your personal API key.

## License

This project is for personal and demo use. Add your own license if you plan to publish it more broadly.

## Troubleshooting

### API call fails

- Confirm `.env` has a valid `ARK_API_KEY`
- Confirm the server is running
- Check Render environment variables if deployed

### Local server not starting

- Run `npm install`
- Ensure Node version is 18+ recommended
- Check if port 8787 is free

---

For the Chinese version, see [README.zh.md](README.zh.md).

# Gridiron Studio — GitHub Pages Setup
# Live at: https://necker44.github.io/gridiron-studio/

## One-time setup (do this once, ever)

### 1. Download and unzip the project
Unzip gridiron-studio.zip somewhere on your computer, like your Desktop.

### 2. Open Terminal in that folder
- Mac: right-click the folder → "New Terminal at Folder"  
- Windows: open the folder, click the address bar, type `cmd`, hit Enter

### 3. Install dependencies
```
npm install
```

### 4. Test it locally (optional but recommended)
```
npm run dev
```
Open http://localhost:5173/gridiron-studio/ — the app should load.
Press Ctrl+C to stop when done.

### 5. Create the GitHub repo
- Go to github.com/new
- Name it exactly: gridiron-studio
- Set to Public
- Do NOT check "Add a README" (leave everything unchecked)
- Click Create Repository

### 6. Push the code
Run these commands one at a time in your terminal:
```
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/necker44/gridiron-studio.git
git push -u origin main
```

### 7. Enable GitHub Pages
- Go to https://github.com/necker44/gridiron-studio/settings/pages
- Under Source, select: GitHub Actions
- Click Save

### 8. Wait ~2 minutes
Go to https://github.com/necker44/gridiron-studio/actions
Watch the deploy workflow run. Green checkmark = done.

### 9. Your app is live at:
https://necker44.github.io/gridiron-studio/

Bookmark it. Share it. That's it.

---

## Making updates later

Whenever you want to change something:
1. Edit the files
2. Run these three commands:
```
git add .
git commit -m "describe what you changed"
git push
```
GitHub auto-redeploys in ~2 minutes.

---

## Where plays are saved

Plays save to your browser's localStorage — they persist between sessions
automatically. If you clear browser site data, plays will be gone, so
occasionally export them (feature can be added later).

## Viewing on iPhone

Just open https://necker44.github.io/gridiron-studio/ in Safari.
To add it to your home screen: Share button → Add to Home Screen.

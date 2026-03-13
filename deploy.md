# Deploying to GitHub Pages

## Initial Setup (one time)

### 1. Create a GitHub repository

```bash
cd pom-tutorials
git init
git add -A
git commit -m "Initial commit: POM tutorial site"
```

Go to [github.com/new](https://github.com/new) and create a new repository (e.g., `pom-tutorials`). Then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/pom-tutorials.git
git branch -M main
git push -u origin main
```

### 2. Enable GitHub Pages

1. Go to your repo on GitHub
2. Click **Settings** > **Pages** (left sidebar)
3. Under **Source**, select **Deploy from a branch**
4. Set branch to **main** and folder to **/ (root)**
5. Click **Save**

Your site will be live at:
```
https://YOUR_USERNAME.github.io/pom-tutorials/
```

It takes 1-2 minutes for the first deploy.

## Updating the Site

After any changes:

```bash
git add -A
git commit -m "Update session materials"
git push
```

GitHub Pages rebuilds automatically. Changes appear within ~60 seconds.

## Custom Domain (Optional)

1. In repo **Settings > Pages**, enter your custom domain
2. Add a CNAME DNS record pointing to `YOUR_USERNAME.github.io`
3. GitHub will auto-create a `CNAME` file in your repo

## Changing the Solutions Password

```bash
# Generate hash for your new password
echo -n "NEW_PASSWORD_HERE" | shasum -a 256

# Edit js/config.js — replace the passwordHash value
# Then push:
git add js/config.js
git commit -m "Update solutions password"
git push
```

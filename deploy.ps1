# Build the project
Write-Host "Building project..." -ForegroundColor Green
npm run build

# Deploy to GitHub Pages
Write-Host "Deploying to GitHub Pages..." -ForegroundColor Green
git checkout --orphan gh-pages
git rm -rf .
Copy-Item -Path "dist\*" -Destination "." -Recurse -Force
git add -A
git commit -m "Deploy to GitHub Pages"
git push -u origin gh-pages

# Switch back to main branch
Write-Host "Switching back to main branch..." -ForegroundColor Green
git checkout main

Write-Host "Deployment complete! Visit: https://simonwillbe888.github.io/IDC-System/" -ForegroundColor Green
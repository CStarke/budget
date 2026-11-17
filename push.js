const { execSync } = require('child_process');
execSync('git add -A', { stdio: 'inherit' });
execSync('git commit -m "Add dark color-scheme and dark_theme_color for Android bottom navigation bar v72"', { stdio: 'inherit' });
execSync('git push origin main', { stdio: 'inherit' });
console.log('Done pushing v72');

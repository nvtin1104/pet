// Enhanced icon creation script for PetFocus
// Creates minimalist SVG and PNG icons matching the black/white/green theme

const fs = require('fs');
const path = require('path');

// Main app icon - Modern minimalist pet dog face
function createMainIcon(size = 256) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 256 256">
  <!-- Background circle -->
  <circle cx="128" cy="128" r="120" fill="#000000" stroke="#22c55e" stroke-width="8"/>
  
  <!-- Pet face (minimalist dog/cat) -->
  <!-- Eyes -->
  <circle cx="104" cy="108" r="8" fill="#22c55e"/>
  <circle cx="152" cy="108" r="8" fill="#22c55e"/>
  
  <!-- Nose -->
  <path d="M128 130 Q120 140 128 145 Q136 140 128 130Z" fill="#22c55e"/>
  
  <!-- Mouth -->
  <path d="M128 145 Q118 155 108 150" stroke="#22c55e" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M128 145 Q138 155 148 150" stroke="#22c55e" stroke-width="3" fill="none" stroke-linecap="round"/>
  
  <!-- Ears -->
  <ellipse cx="90" cy="80" rx="12" ry="20" fill="#22c55e" transform="rotate(-25 90 80)"/>
  <ellipse cx="166" cy="80" rx="12" ry="20" fill="#22c55e" transform="rotate(25 166 80)"/>
  
  <!-- Focus dots (minimalist geometric touch) -->
  <circle cx="128" cy="190" r="3" fill="#22c55e" opacity="0.6"/>
  <circle cx="140" cy="190" r="2" fill="#22c55e" opacity="0.4"/>
  <circle cx="116" cy="190" r="2" fill="#22c55e" opacity="0.4"/>
</svg>`;

  return svg;
}

// Tray icon - Ultra minimal version
function createTrayIcon(size = 32) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32">
  <!-- Minimal pet face for tray -->
  <rect width="32" height="32" rx="6" fill="#000000"/>
  
  <!-- Simple eyes -->
  <circle cx="12" cy="13" r="2" fill="#22c55e"/>
  <circle cx="20" cy="13" r="2" fill="#22c55e"/>
  
  <!-- Simple nose -->
  <circle cx="16" cy="18" r="1.5" fill="#22c55e"/>
  
  <!-- Activity indicator -->
  <circle cx="16" cy="26" r="1" fill="#22c55e" opacity="0.7"/>
</svg>`;

  return svg;
}

// Favicon - Smallest version
function createFavicon(size = 16) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 16 16">
  <rect width="16" height="16" rx="3" fill="#000000"/>
  <circle cx="6" cy="6" r="1" fill="#22c55e"/>
  <circle cx="10" cy="6" r="1" fill="#22c55e"/>
  <circle cx="8" cy="9" r="0.8" fill="#22c55e"/>
  <circle cx="8" cy="13" r="0.5" fill="#22c55e" opacity="0.7"/>
</svg>`;

  return svg;
}

// Logo for settings - Text combined with icon
function createLogo() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60" viewBox="0 0 200 60">
  <!-- Icon part -->
  <circle cx="30" cy="30" r="24" fill="#000000" stroke="#22c55e" stroke-width="2"/>
  <circle cx="24" cy="24" r="2" fill="#22c55e"/>
  <circle cx="36" cy="24" r="2" fill="#22c55e"/>
  <path d="M30 30 Q26 34 30 36 Q34 34 30 30Z" fill="#22c55e"/>
  <path d="M30 36 Q24 40 20 38" stroke="#22c55e" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M30 36 Q36 40 40 38" stroke="#22c55e" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  
  <!-- Text part -->
  <text x="65" y="25" font-family="Inter, system-ui, sans-serif" font-size="18" font-weight="600" fill="#22c55e">PetFocus</text>
  <text x="65" y="42" font-family="Inter, system-ui, sans-serif" font-size="12" font-weight="400" fill="#666666">Desktop Pet Productivity</text>
</svg>`;

  return svg;
}

// Create all icons
async function createAllIcons() {
  const assetsDir = path.join(__dirname, '..', 'assets');
  const publicDir = path.join(__dirname, '..', 'public');
  
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  // Main app icon (multiple sizes)
  fs.writeFileSync(path.join(assetsDir, 'icon.svg'), createMainIcon(256));
  fs.writeFileSync(path.join(assetsDir, 'icon-128.svg'), createMainIcon(128));
  fs.writeFileSync(path.join(assetsDir, 'icon-64.svg'), createMainIcon(64));
  
  // Tray icon
  fs.writeFileSync(path.join(assetsDir, 'tray-icon.svg'), createTrayIcon(32));
  fs.writeFileSync(path.join(assetsDir, 'tray-icon-16.svg'), createTrayIcon(16));
  
  // Favicon
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), createFavicon(16));
  
  // Logo for settings
  fs.writeFileSync(path.join(assetsDir, 'logo.svg'), createLogo());
  
  console.log('✅ All minimalist icons created successfully!');
  console.log('📁 Files created:');
  console.log('  - assets/icon.svg (main app icon)');
  console.log('  - assets/icon-128.svg');
  console.log('  - assets/icon-64.svg');
  console.log('  - assets/tray-icon.svg');
  console.log('  - assets/tray-icon-16.svg');
  console.log('  - assets/logo.svg');
  console.log('  - public/favicon.svg');
  console.log('');
  console.log('🎨 Icons match the minimalist black/white/green theme');
  console.log('💡 To convert to PNG, use: npm install sharp (see package.json)');
}

createAllIcons().catch(console.error);

// Script to extract tray icon from sprite sheet
// Run with: node scripts/create-icon.js

const fs = require('fs');
const path = require('path');

// Create a simple 32x32 icon placeholder
// In production, you would use sharp or canvas to extract from sprite

const iconData = `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="#1a1a2e" rx="4"/>
  <path d="M16 6 L20 10 L20 16 L18 18 L18 24 L14 24 L14 18 L12 16 L12 10 Z" fill="#4a7a9a"/>
  <circle cx="16" cy="8" r="3" fill="#6a6a8a"/>
  <rect x="14" y="24" width="1" height="2" fill="#2a2a3a"/>
  <rect x="17" y="24" width="1" height="2" fill="#2a2a3a"/>
</svg>
`;

// For Electron tray on Windows, we need a PNG
// This creates a simple placeholder - in production use proper icon extraction

const svgBuffer = Buffer.from(iconData.trim());
const outputPath = path.join(__dirname, '..', 'assets', 'icon.svg');

fs.writeFileSync(outputPath, svgBuffer);
console.log('Icon created at:', outputPath);

// Note: For Windows tray, convert SVG to PNG using:
// - sharp library
// - or online converter
// - or include a pre-made PNG

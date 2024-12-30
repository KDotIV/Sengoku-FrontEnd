const fs = require('fs');
const path = require('path');

const sourcePath = path.resolve(__dirname, 'dist/sengoku-frontend-web/browser/staticwebapp.config.json');
const destinationPath = path.resolve(__dirname, 'dist/sengoku-frontend-web/staticwebapp.config.json');

// Check if the source file exists
if (fs.existsSync(sourcePath)) {
  // Ensure the destination directory exists
  const destinationDir = path.dirname(destinationPath);
  if (!fs.existsSync(destinationDir)) {
    fs.mkdirSync(destinationDir, { recursive: true });
  }

  // Move the file
  fs.renameSync(sourcePath, destinationPath);
  console.log(`Moved staticwebapp.config.json to ${destinationPath}`);
} else {
  console.error(`Source file not found: ${sourcePath}`);
}

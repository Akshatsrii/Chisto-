const fs = require('fs');
const path = require('path');

const targetDirs = [
  path.join(__dirname, 'Frontend', 'src'),
  path.join(__dirname, 'admin', 'src')
];

const colorReplacements = [
  { from: /#e25822/gi, to: '#0c2340' },  // Burnt orange -> Deep Navy
  { from: /#ffeae2/gi, to: '#e2ecf7' },  // Orange border tint -> soft blue border tint
  { from: /#fff6f3/gi, to: '#f2f6fa' },  // Orange background wash -> soft blue background wash
  { from: /#ff6b6b/gi, to: '#0c2340' },
  { from: /#ff6b35/gi, to: '#0c2340' },
  { from: /#ff4c24/gi, to: '#0c2340' },
  { from: /#ff5722/gi, to: '#08182d' }   // Hover states
];

function processDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      processDir(filePath);
    } else if (stat.isFile() && (file.endsWith('.css') || file.endsWith('.jsx') || file.endsWith('.js'))) {
      let content = fs.readFileSync(filePath, 'utf8');
      let changed = false;
      
      colorReplacements.forEach(rep => {
        if (rep.from.test(content)) {
          content = content.replace(rep.from, rep.to);
          changed = true;
        }
      });
      
      if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated theme to Navy in: ${filePath}`);
      }
    }
  });
}

console.log("Starting Deep Navy theme updates...");
targetDirs.forEach(dir => processDir(dir));
console.log("Deep Navy theme updates complete!");

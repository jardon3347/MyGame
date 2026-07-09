const fs = require('fs');
const path = 'C:\\Users\\admin\\Downloads\\Mygame\\js\\data.js';
let code = fs.readFileSync(path, 'utf8');

// Fix 1: Fix indentation of description blocks (12 spaces -> 6 spaces)
code = code.replace(/            description: \{/g, '      description: {');

// Fix 2: Restore missing "categories:" keyword after each description block
// Pattern: },\n [  should become },\n      categories: [
code = code.replace(/\},\r?\n \[/g, '},\n      categories: [');

// Verify syntax
try {
  new Function(code);
  console.log('Syntax OK');
} catch(e) {
  console.error('Syntax error:', e.message);
}

fs.writeFileSync(path, code, 'utf8');
console.log('Fixes applied');

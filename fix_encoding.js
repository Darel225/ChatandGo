const fs = require('fs');
const path = require('path');

const replacements = {
  'Ã©': 'é', 'Ã¨': 'è', 'Ã ': 'à', 'Ã¢': 'â', 'Ãª': 'ê', 
  'Ã§': 'ç', 'Ã®': 'î', 'Ã´': 'ô', 'Ã»': 'û', 'Ã¹': 'ù', 'Ã¯': 'ï',
  'dÃ©solÃ©': 'désolé', 'DÃ©solÃ©': 'Désolé', 'qualifiÃ©s': 'qualifiés', 'dÃ©placer': 'déplacer',
  'VÃ©rification': 'Vérification', 'envoyÃ©': 'envoyé', 'sÃ©curisÃ©es': 'sécurisées',
  'Ǹ': 'é'
};

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== 'venv' && file !== '__pycache__' && !file.startsWith('.')) {
        walk(fullPath);
      }
    } else if (fullPath.endsWith('.py') || fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = content;

      for (const [bad, good] of Object.entries(replacements)) {
        modified = modified.split(bad).join(good);
      }

      if (modified !== content) {
        fs.writeFileSync(fullPath, modified, 'utf8');
        console.log('Fixed:', fullPath);
      }
    }
  }
}

walk('.');

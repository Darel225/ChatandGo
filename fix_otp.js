const fs = require('fs');
const file = 'C:/Users/Simplon-CI/Desktop/ChatAndGo/app/(auth)/verify-otp.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/Code envoyé Ã l'adresse/g, "Code envoyé à l'adresse");
content = content.replace(/â€“/g, "-");
content = content.replace(/\?"/g, "-");

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed verify-otp.jsx');

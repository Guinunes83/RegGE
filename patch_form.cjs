const fs = require('fs');
let content = fs.readFileSync('components/ParticipantForm.tsx', 'utf8');

// remove E-mail, Nº No Estudo (participantNumber)
content = content.replace(/<ParticipantInput[^>]*label="E-mail"[\s\S]*?\/>/, '');
content = content.replace(/<ParticipantInput[^>]*label="Nº No Estudo"[\s\S]*?\/>/, '');

fs.writeFileSync('components/ParticipantForm.tsx', content);

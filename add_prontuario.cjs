const fs = require('fs');
let content = fs.readFileSync('components/ParticipantForm.tsx', 'utf8');

const regex = /(<ParticipantInput[^>]*label="Estudo"[\s\S]*?\/>)/;
content = content.replace(regex, `$1
             <ParticipantInput 
               label="Nº Prontuário" 
               value={formData.prontuario} 
               onChange={(v: string) => setFormData({...formData, prontuario: v})} 
               isView={isView} 
               span="md:col-span-1"
             />`);

fs.writeFileSync('components/ParticipantForm.tsx', content);

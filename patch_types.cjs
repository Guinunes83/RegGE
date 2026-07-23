const fs = require('fs');
let content = fs.readFileSync('types.ts', 'utf8');

const regex = /export type Patient = \{[\s\S]*?\};/;
const newType = `export type Patient = {
  id: string;
  participantNumber: string;
  screeningNumber?: string;
  prontuario?: string;
  name: string;
  birthDate: string;
  sex?: 'M' | 'F';
  studyId: string;
  treatment?: string;
  randomization?: string;
  status: string;
  observations?: string;
  contact?: string;
  secondaryContact?: string;
  tcleDate?: string;
  cpf?: string;
};`;

content = content.replace(regex, newType);
fs.writeFileSync('types.ts', content);

const fs = require('fs');
let content = fs.readFileSync('src/main/java/com/elora/regge/service/CsvImportService.java', 'utf8');

const oldImport = `                patient.setParticipantNumber(safeGet(data, 0));
                patient.setScreeningNumber(safeGet(data, 1));
                patient.setName(safeGet(data, 2));
                patient.setEmail(safeGet(data, 3));
                patient.setBirthDate(safeGetDate(data, 4));
                patient.setSex(safeGet(data, 5));
                patient.setStudyId(safeGet(data, 6));
                patient.setTreatment(safeGet(data, 7));
                patient.setRandomization(safeGet(data, 8));
                patient.setStatus(safeGet(data, 9));
                patient.setObservations(safeGet(data, 10));
                patient.setInitials(safeGet(data, 11));
                patient.setContact(safeGet(data, 12));
                patient.setSecondaryContact(safeGet(data, 13));
                patient.setTcleDate(safeGetDate(data, 14));`;

// user says: Retire a coluna e-mail, numero do participante, iniciais
// Adicione uma coluna antes da coluna Número do Participante com nome Estudo 
// Mude o nome da coluna ID do Estudo para nº prontuario
const newImport = `                patient.setStudyId(safeGet(data, 0)); // Estudo
                // patient.setParticipantNumber(safeGet(data, ...)); // Retirado conforme solicitado
                patient.setScreeningNumber(safeGet(data, 1)); // Número de Triagem
                patient.setProntuario(safeGet(data, 2)); // Nº Prontuário (antigo ID do Estudo)
                patient.setName(safeGet(data, 3)); // Nome
                patient.setCpf(safeGet(data, 4)); // CPF
                patient.setBirthDate(safeGetDate(data, 5)); // Data de Nascimento
                patient.setSex(safeGet(data, 6)); // Sexo
                patient.setTreatment(safeGet(data, 7)); // Tratamento
                patient.setRandomization(safeGet(data, 8)); // Randomização
                patient.setStatus(safeGet(data, 9)); // Status
                patient.setObservations(safeGet(data, 10)); // Observações
                patient.setContact(safeGet(data, 11)); // Contato
                patient.setSecondaryContact(safeGet(data, 12)); // Contato Secundário
                patient.setTcleDate(safeGetDate(data, 13)); // Data TCLE`;

content = content.replace(oldImport, newImport);
fs.writeFileSync('src/main/java/com/elora/regge/service/CsvImportService.java', content);

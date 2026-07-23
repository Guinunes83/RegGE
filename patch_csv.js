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

const newImport = `                patient.setStudyId(safeGet(data, 0)); // Estudo
                patient.setParticipantNumber(safeGet(data, 1)); // Número do Participante
                patient.setScreeningNumber(safeGet(data, 2)); // Screening
                patient.setProntuario(safeGet(data, 3)); // nº prontuario (was ID do Estudo)
                patient.setName(safeGet(data, 4)); // Nome
                patient.setCpf(safeGet(data, 5)); // CPF (added based on form)
                patient.setBirthDate(safeGetDate(data, 6)); // Data de Nascimento
                patient.setSex(safeGet(data, 7)); // Sexo
                patient.setTreatment(safeGet(data, 8)); // Tratamento
                patient.setRandomization(safeGet(data, 9)); // Randomização
                patient.setStatus(safeGet(data, 10)); // Status
                patient.setObservations(safeGet(data, 11)); // Observações
                patient.setContact(safeGet(data, 12)); // Contato
                patient.setSecondaryContact(safeGet(data, 13)); // Contato Secundário
                patient.setTcleDate(safeGetDate(data, 14)); // Data TCLE`;

content = content.replace(oldImport, newImport);
fs.writeFileSync('src/main/java/com/elora/regge/service/CsvImportService.java', content);

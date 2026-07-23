const fs = require('fs');
let content = fs.readFileSync('components/ParticipantForm.tsx', 'utf8');

const regex = /(<section>[\s\S]*?<div className="grid grid-cols-1 md:grid-cols-4 gap-3">)[\s\S]*?(<div className="md:col-span-4">[\s\S]*?label="Observação")/m;

const newSection = `$1
             {/* Linha 1 */}
             <ParticipantInput 
               label="Nome Completo" 
               value={formData.name} 
               onChange={(v: string) => setFormData({...formData, name: v})} 
               isView={isView} 
               span="md:col-span-2"
               required
             />
             <ParticipantInput 
               label="Sexo" 
               value={formData.sex} 
               onChange={(v: string) => setFormData({...formData, sex: v as 'M' | 'F'})} 
               options={['M', 'F']}
               isView={isView}
               span="md:col-span-1"
             />
             <ParticipantInput 
               label="Data Nasc." 
               value={formData.birthDate} 
               onChange={(v: string) => setFormData({...formData, birthDate: v})} 
               type="date" 
               isView={isView} 
               span="md:col-span-1"
             />
             
             {/* Linha 2 */}
             <ParticipantInput 
               label="Contato Principal" 
               value={formData.contact} 
               onChange={(v: string) => setFormData({...formData, contact: v})} 
               isView={isView} 
               mask="phone"
               placeholder="(00) 00000-0000"
               span="md:col-span-1"
             />
             <ParticipantInput 
               label="Contato Secundário" 
               value={formData.secondaryContact} 
               onChange={(v: string) => setFormData({...formData, secondaryContact: v})} 
               isView={isView} 
               mask="phone"
               placeholder="(00) 00000-0000"
               span="md:col-span-1"
             />
             <ParticipantInput 
               label="CPF" 
               value={formData.cpf} 
               onChange={(v: string) => setFormData({...formData, cpf: v})} 
               isView={isView} 
               mask="cpf"
               placeholder="000.000.000-00"
               span="md:col-span-1"
             />
             <ParticipantInput 
               label="Nº Prontuário" 
               value={formData.prontuario} 
               onChange={(v: string) => setFormData({...formData, prontuario: v})} 
               isView={isView} 
               span="md:col-span-1"
             />
             
             {/* Linha 3 */}
             <ParticipantInput 
               label="Nº Screening" 
               value={formData.screeningNumber} 
               onChange={(v: string) => setFormData({...formData, screeningNumber: v})} 
               isView={isView} 
               span="md:col-span-1"
             />
             <ParticipantInput 
               label="Nº Rand." 
               value={formData.randomization} 
               onChange={(v: string) => setFormData({...formData, randomization: v})} 
               isView={isView}
               span="md:col-span-1"
             />
             <ParticipantInput 
               label="Estudo" 
               value={formData.studyId} 
               onChange={(v: string) => setFormData({...formData, studyId: v})} 
               options={studyOptions} 
               displayValue={currentStudyName} 
               isView={isView} 
               span="md:col-span-2"
             />
             
             {/* Linha 4 */}
             <ParticipantInput 
               label="Tratamento" 
               value={formData.treatment} 
               onChange={(v: string) => setFormData({...formData, treatment: v})} 
               isView={isView} 
               span="md:col-span-1"
             />
             <ParticipantInput 
               label="Status" 
               value={formData.status} 
               onChange={(v: string) => setFormData({...formData, status: v})} 
               options={DROPDOWN_OPTIONS.participantStatus} 
               isView={isView} 
               span="md:col-span-1"
             />
             <ParticipantInput 
               label="Data Assin. TCLE" 
               value={formData.tcleDate} 
               onChange={(v: string) => setFormData({...formData, tcleDate: v})} 
               type="date" 
               isView={isView} 
               span="md:col-span-1"
             />

             {/* Linha 5 */}
             $2`;

content = content.replace(regex, newSection);
fs.writeFileSync('components/ParticipantForm.tsx', content);

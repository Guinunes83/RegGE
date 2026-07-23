const fs = require('fs');
let content = fs.readFileSync('components/ParticipantForm.tsx', 'utf8');

const sectionTitleDef = `
const SectionTitle = ({ title }: { title: string }) => (
  <div className="bg-[#d1e7e4] text-[#007b63] font-bold text-center py-1.5 uppercase tracking-widest text-xs mb-4 border-b border-[#007b63]/20">
    {title}
  </div>
);

const ParticipantInput = ({ `;

content = content.replace(/const ParticipantInput = \(\{ /g, sectionTitleDef);

fs.writeFileSync('components/ParticipantForm.tsx', content);

const fs = require('fs');
let content = fs.readFileSync('components/ParticipantForm.tsx', 'utf8');

const regex = /<section className="border-t border-gray-200 pt-6">[\s\S]*?<thead className="bg-\[#007b63\] text-white uppercase tracking-tighter">/m;

const newHeader = `<section>
                <SectionTitle title="HISTÓRICO DE CONSULTAS & SINAIS VITAIS" />
                
                <div className="overflow-x-auto border rounded-lg bg-white shadow-sm">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-[#007b63] text-white">`;

content = content.replace(regex, newHeader);

// replace tbody
content = content.replace(/<tbody className="divide-y divide-gray-100">/, '<tbody className="divide-y">');

fs.writeFileSync('components/ParticipantForm.tsx', content);

const fs = require('fs');
let content = fs.readFileSync('components/StudyForm.tsx', 'utf8');

const oldInput = `          <input 
            type={isView ? (type === 'password' || type === 'date' ? 'text' : type) : type}
            readOnly={isView}
            className={\`border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#007b63] outline-none transition-all flex-1 w-full \${isView ? 'bg-gray-100 cursor-text text-gray-800 font-medium' : 'bg-white'}\`}
            value={displayValue || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={isView ? '' : \`Digite \${label.toLowerCase()}...\`}
          />`;

const newInput = `          isTextArea ? (
            <textarea
              readOnly={isView}
              rows={3}
              className={\`border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#007b63] outline-none transition-all flex-1 w-full resize-y overflow-y-auto \${isView ? 'bg-gray-100 cursor-text text-gray-800 font-medium' : 'bg-white'}\`}
              value={displayValue || ''}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => {
                if (isBulletList && e.key === 'Enter') {
                  e.preventDefault();
                  const target = e.target;
                  const start = target.selectionStart;
                  const end = target.selectionEnd;
                  const value = target.value;
                  const newValue = value.substring(0, start) + '\\n• ' + value.substring(end);
                  onChange(newValue);
                  
                  // Need to move cursor after bullet in next tick
                  setTimeout(() => {
                    target.selectionStart = target.selectionEnd = start + 3;
                  }, 0);
                }
              }}
              onFocus={(e) => {
                if (isBulletList && !e.target.value) {
                  onChange('• ');
                }
              }}
              placeholder={isView ? '' : \`Digite \${label.toLowerCase()}...\`}
            />
          ) : (
          <input 
            type={isView ? (type === 'password' || type === 'date' ? 'text' : type) : type}
            readOnly={isView}
            className={\`border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#007b63] outline-none transition-all flex-1 w-full \${isView ? 'bg-gray-100 cursor-text text-gray-800 font-medium' : 'bg-white'}\`}
            value={displayValue || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={isView ? '' : \`Digite \${label.toLowerCase()}...\`}
          />
          )`;

const inputPropsOld = `  onAdd // Prop para função de adicionar novo item
}: any) => {`;

const inputPropsNew = `  onAdd, // Prop para função de adicionar novo item
  isTextArea = false,
  isBulletList = false
}: any) => {`;

content = content.replace(oldInput, newInput);
content = content.replace(inputPropsOld, inputPropsNew);

fs.writeFileSync('components/StudyForm.tsx', content);

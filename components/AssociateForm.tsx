import React, { useState } from 'react';
import { Associate, PaymentEntry } from '../types';
import { UnsavedChangesModal, useUnsavedChanges } from './UnsavedChangesModal';

interface AssociateFormProps {
  associate?: Associate;
  mode: 'edit' | 'view';
  onSave: (data: Partial<Associate>) => void;
  onCancel: () => void;
  onEdit?: () => void;
  isReadOnly?: boolean;
}

const SectionTitle = ({ title }: { title: string }) => (
  <div className="bg-[#d1e7e4] text-[#007b63] font-bold text-center py-1.5 uppercase tracking-widest text-xs mb-4 border-b border-[#007b63]/20">
    {title}
  </div>
);

const FormInput = ({ 
  label, 
  value, 
  onChange,
  isView,
  type = "text", 
  options, 
  required = false,
  placeholder,
  span
}: any) => (
  <div className={`flex flex-col gap-1 w-full ${span || ''}`}>
    <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">
      {label} {required && !isView && <span className="text-red-500">*</span>}
    </label>
    {options && !isView ? (
      <select 
        className="border border-gray-300 rounded-md px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-[#007b63] outline-none"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Selecione...</option>
        {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
      </select>
    ) : (
      <input 
        type={isView ? "text" : type}
        readOnly={isView}
        placeholder={isView ? '' : placeholder}
        className={`border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#007b63] outline-none transition-all ${isView ? 'bg-gray-100' : 'bg-white'}`}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      />
    )}
  </div>
);

export const AssociateForm: React.FC<AssociateFormProps> = ({ associate, mode, onSave, onCancel, onEdit, isReadOnly = false }) => {
  const [formData, setFormData] = useState<Partial<Associate>>(associate || {
    status: 'Ativo',
    reRegistrationsJson: '[]',
    paymentsJson: '[]'
  });

  const [payments, setPayments] = useState<PaymentEntry[]>(JSON.parse(formData.paymentsJson || '[]'));
  const [newPayment, setNewPayment] = useState({ method: '', value: '', date: '' });

  const isView = mode === 'view';

  const handleFieldChange = (name: keyof Associate, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const formatDateView = (dateString?: string) => {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  };

  const handleAddPayment = () => {
    if (!newPayment.method || !newPayment.value || !newPayment.date) return;
    const updated = [...payments, { id: crypto.randomUUID(), ...newPayment }];
    setPayments(updated);
    handleFieldChange('paymentsJson', JSON.stringify(updated));
    setNewPayment({ method: '', value: '', date: '' });
  };

  const handleRemovePayment = (id: string) => {
    const updated = payments.filter(p => p.id !== id);
    setPayments(updated);
    handleFieldChange('paymentsJson', JSON.stringify(updated));
  };

  const performValidationAndSave = async (): Promise<boolean> => {
    if (!formData.name) {
      alert('O campo Nome é obrigatório.');
      return false;
    }
    await onSave(formData);
    return true;
  };

  const { isModalOpen, handleSaveAndLeave, handleDiscard, handleCancel, bypassInterceptor } = useUnsavedChanges(!isView && !isReadOnly, performValidationAndSave);

  const handleSaveClick = async () => {
    bypassInterceptor();
    await performValidationAndSave();
  };

  const handleCancelClick = () => {
    bypassInterceptor();
    onCancel();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-2xl w-full max-w-5xl mx-auto overflow-hidden relative flex flex-col h-full">
      <UnsavedChangesModal 
        isOpen={isModalOpen}
        onSaveAndLeave={handleSaveAndLeave}
        onDiscardAndLeave={handleDiscard}
        onCancel={handleCancel}
      />
      <div className="bg-[#007b63] text-white py-4 px-6 flex justify-between items-center shrink-0">
        <h2 className="text-xl font-bold tracking-tight">
          {isView ? 'Ficha Cadastral do Associado' : 'Cadastro de Associado'}
        </h2>
        <button onClick={handleCancelClick} className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-8 flex flex-col gap-8 overflow-y-auto flex-1 bg-gray-50/50">
        <section>
          <SectionTitle title="DADOS PESSOAIS" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <FormInput label="Nome" value={formData.name} onChange={(v: string) => handleFieldChange('name', v)} required isView={isView} span="md:col-span-2" />
            <FormInput label="Data Nascimento (DN)" value={isView ? formatDateView(formData.birthDate) : formData.birthDate} onChange={(v: string) => handleFieldChange('birthDate', v)} type="date" isView={isView} />
            <FormInput label="CPF" value={formData.cpf} onChange={(v: string) => handleFieldChange('cpf', v)} required isView={isView} placeholder="000.000.000-00" />
            
            <FormInput label="Naturalidade" value={formData.naturalness} onChange={(v: string) => handleFieldChange('naturalness', v)} isView={isView} />
            <FormInput label="Nacionalidade" value={formData.nationality} onChange={(v: string) => handleFieldChange('nationality', v)} isView={isView} />
          </div>
        </section>

        <section>
          <SectionTitle title="CONTATO E ENDEREÇO" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <FormInput label="E-mail" value={formData.email} onChange={(v: string) => handleFieldChange('email', v)} type="email" isView={isView} span="md:col-span-2" />
            <FormInput label="Telefone 1" value={formData.phone1} onChange={(v: string) => handleFieldChange('phone1', v)} isView={isView} />
            <FormInput label="Telefone 2" value={formData.phone2} onChange={(v: string) => handleFieldChange('phone2', v)} isView={isView} />
            
            <FormInput label="Endereço Res." value={formData.address} onChange={(v: string) => handleFieldChange('address', v)} isView={isView} span="md:col-span-2" />
            <FormInput label="Complemento" value={formData.addressComplement} onChange={(v: string) => handleFieldChange('addressComplement', v)} isView={isView} />
            <FormInput label="Bairro" value={formData.neighborhood} onChange={(v: string) => handleFieldChange('neighborhood', v)} isView={isView} />
            
            <FormInput label="Cidade" value={formData.city} onChange={(v: string) => handleFieldChange('city', v)} isView={isView} />
            <FormInput label="Estado" value={formData.state} onChange={(v: string) => handleFieldChange('state', v)} isView={isView} />
            <FormInput label="CEP" value={formData.cep} onChange={(v: string) => handleFieldChange('cep', v)} isView={isView} />
          </div>
        </section>

        <section>
          <SectionTitle title="STATUS E VÍNCULO" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <FormInput label="Status" value={formData.status} onChange={(v: string) => handleFieldChange('status', v)} options={['Ativo', 'Inativo', 'Recadastro']} required isView={isView} />
            <FormInput label="Sócio Desde" value={isView ? formatDateView(formData.memberSince) : formData.memberSince} onChange={(v: string) => handleFieldChange('memberSince', v)} type="date" isView={isView} />
            <FormInput label="Pedido de Saída" value={isView ? formatDateView(formData.exitRequestDate) : formData.exitRequestDate} onChange={(v: string) => handleFieldChange('exitRequestDate', v)} type="date" isView={isView} />
            <FormInput label="Tipo de Sócio" value={formData.associateType} onChange={(v: string) => handleFieldChange('associateType', v)} isView={isView} />
            <FormInput label="Vínculo" value={formData.bond} onChange={(v: string) => handleFieldChange('bond', v)} isView={isView} />
            <FormInput label="Função" value={formData.role} onChange={(v: string) => handleFieldChange('role', v)} isView={isView} />
          </div>
        </section>

        <section>
          <SectionTitle title="PAGAMENTOS E RECADASTRO" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
            <FormInput label="Dia Vencimento Padrão" value={formData.dueDay} onChange={(v: string) => handleFieldChange('dueDay', v)} type="number" isView={isView} />
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Histórico de Pagamentos</label>
            
            {!isView && (
              <div className="flex items-end gap-3 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <FormInput label="Método de Pagamento" value={newPayment.method} onChange={(v: string) => setNewPayment(prev => ({...prev, method: v}))} options={['IN LOCO', 'BOLETO', 'TRANSFERÊNCIA']} />
                <FormInput label="Valor (R$)" value={newPayment.value} onChange={(v: string) => setNewPayment(prev => ({...prev, value: v}))} type="number" />
                <FormInput label="Data do Pagamento" value={newPayment.date} onChange={(v: string) => setNewPayment(prev => ({...prev, date: v}))} type="date" />
                <button 
                  onClick={handleAddPayment} 
                  className="bg-[#007b63] text-white px-6 py-2 rounded-md text-sm font-bold h-[38px] hover:bg-[#005a48] transition-colors whitespace-nowrap"
                >
                  Adicionar
                </button>
              </div>
            )}
            
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-100 text-gray-600">
                  <tr>
                    <th className="px-4 py-3 font-bold uppercase text-[10px] tracking-wider">Data</th>
                    <th className="px-4 py-3 font-bold uppercase text-[10px] tracking-wider">Método</th>
                    <th className="px-4 py-3 font-bold uppercase text-[10px] tracking-wider">Valor</th>
                    {!isView && <th className="px-4 py-3 font-bold uppercase text-[10px] tracking-wider w-10">Ações</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payments.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{formatDateView(p.date)}</td>
                      <td className="px-4 py-3">{p.method}</td>
                      <td className="px-4 py-3 font-medium text-green-700">R$ {p.value}</td>
                      {!isView && (
                        <td className="px-4 py-3">
                          <button onClick={() => handleRemovePayment(p.id)} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan={isView ? 3 : 4} className="px-4 py-8 text-center text-gray-400 italic text-xs">
                        Nenhum pagamento registrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      <div className="p-4 bg-white border-t border-gray-200 flex justify-between items-center px-8 py-6 shrink-0 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
        <div className="flex gap-3 ml-auto">
          {isView || isReadOnly ? (
            <>
               <button onClick={handleCancelClick} className="px-6 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors">
                 Fechar
               </button>
               {!isReadOnly && (
                 <button onClick={onEdit} className="px-8 py-2 bg-[#007b63] text-white rounded-lg text-sm font-bold shadow-lg shadow-[#007b63]/20 hover:bg-[#005a48] transition-all">
                   Editar
                 </button>
               )}
            </>
          ) : (
            <>
              <button onClick={handleCancelClick} className="px-6 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSaveClick} className="px-8 py-2 bg-[#007b63] text-white rounded-lg text-sm font-bold shadow-lg shadow-[#007b63]/20 hover:bg-[#005a48] transition-all">
                Salvar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

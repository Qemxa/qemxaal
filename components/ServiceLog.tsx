import React, { useState } from 'react';
import { Chat, ServiceRecord } from '../types';
import { PlusIcon, TrashIcon, EditIcon, WrenchScrewdriverIcon } from './IconComponents';

interface ServiceLogProps {
    chat: Chat;
    onSave: (updatedChat: Chat) => void;
}

const ServiceRecordForm: React.FC<{
    onSave: (record: Omit<ServiceRecord, 'id'>) => void;
    onCancel: () => void;
    initialData?: ServiceRecord | null;
}> = ({ onSave, onCancel, initialData }) => {
    const [serviceType, setServiceType] = useState(initialData?.serviceType || '');
    const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
    const [mileage, setMileage] = useState<number | ''>(initialData?.mileage || '');
    const [cost, setCost] = useState<number | ''>(initialData?.cost || '');
    const [notes, setNotes] = useState(initialData?.notes || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!serviceType || !date || !mileage) {
            alert('Please fill in all required fields.');
            return;
        }
        onSave({
            serviceType,
            date,
            mileage: Number(mileage),
            cost: cost ? Number(cost) : undefined,
            notes,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 bg-surface rounded-lg space-y-4 max-w-lg mx-auto my-8">
            <h3 className="text-xl font-bold text-text-main">{initialData ? 'ჩანაწერის რედაქტირება' : 'ახალი ჩანაწერის დამატება'}</h3>
            <div>
                <label className="block text-sm font-medium text-text-light mb-1">სერვისის ტიპი</label>
                <input type="text" value={serviceType} onChange={(e) => setServiceType(e.target.value)} placeholder="მაგ: ზეთის შეცვლა" required className="w-full bg-background text-text-main border border-secondary rounded-md p-2" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-text-light mb-1">თარიღი</label>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full bg-background text-text-main border border-secondary rounded-md p-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-light mb-1">გარბენი (კმ)</label>
                    <input type="number" value={mileage} onChange={(e) => setMileage(Number(e.target.value))} placeholder="123456" required className="w-full bg-background text-text-main border border-secondary rounded-md p-2" />
                </div>
            </div>
             <div>
                <label className="block text-sm font-medium text-text-light mb-1">ღირებულება (₾) (არასავალდებულო)</label>
                <input type="number" step="0.01" value={cost} onChange={(e) => setCost(Number(e.target.value))} placeholder="150.00" className="w-full bg-background text-text-main border border-secondary rounded-md p-2" />
            </div>
            <div>
                <label className="block text-sm font-medium text-text-light mb-1">კომენტარი (არასავალდებულო)</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full bg-background text-text-main border border-secondary rounded-md p-2"></textarea>
            </div>
            <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-secondary text-text-main font-semibold rounded-md hover:bg-opacity-80">გაუქმება</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white font-semibold rounded-md hover:bg-primary-hover">შენახვა</button>
            </div>
        </form>
    )
};


const ServiceLog: React.FC<ServiceLogProps> = ({ chat, onSave }) => {
    const [showForm, setShowForm] = useState(false);
    const [editingRecord, setEditingRecord] = useState<ServiceRecord | null>(null);

    const serviceHistory = [...(chat.serviceHistory || [])].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const handleSaveRecord = (recordData: Omit<ServiceRecord, 'id'>) => {
        let updatedHistory;
        if(editingRecord) {
            updatedHistory = serviceHistory.map(r => r.id === editingRecord.id ? { ...editingRecord, ...recordData } : r);
        } else {
            const newRecord: ServiceRecord = { ...recordData, id: `service-${Date.now()}` };
            updatedHistory = [...serviceHistory, newRecord];
        }
        onSave({...chat, serviceHistory: updatedHistory });
        setShowForm(false);
        setEditingRecord(null);
    };

    const handleDeleteRecord = (recordId: string) => {
        if(window.confirm('დარწმუნებული ხართ, რომ გსურთ ამ ჩანაწერის წაშლა?')) {
            const updatedHistory = serviceHistory.filter(r => r.id !== recordId);
            onSave({...chat, serviceHistory: updatedHistory });
        }
    };
    
    const handleEditRecord = (record: ServiceRecord) => {
        setEditingRecord(record);
        setShowForm(true);
    };
    
    if (showForm) {
        return <ServiceRecordForm onSave={handleSaveRecord} onCancel={() => {setShowForm(false); setEditingRecord(null)}} initialData={editingRecord} />
    }

    return (
        <div className="p-4 md:p-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-bold text-text-main">სერვისის ისტორია</h2>
                 <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors">
                     <PlusIcon className="w-5 h-5"/>
                     ჩანაწერის დამატება
                 </button>
            </div>

            {serviceHistory.length === 0 ? (
                <div className="text-center py-16 px-4 bg-surface rounded-lg">
                    <WrenchScrewdriverIcon className="w-16 h-16 mx-auto text-text-dim" />
                    <p className="mt-4 text-text-light">სერვისის ისტორია ცარიელია.</p>
                    <p className="text-sm text-text-dim">დაამატეთ თქვენი პირველი ჩანაწერი შესრულებული სამუშაოების აღსარიცხად.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {serviceHistory.map(record => (
                        <div key={record.id} className="bg-surface p-4 rounded-lg group">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg text-text-main">{record.serviceType}</h3>
                                    <p className="text-sm text-text-dim">{new Date(record.date).toLocaleDateString('ka-GE')} / {record.mileage.toLocaleString('ka-GE')} კმ</p>
                                </div>
                                <div className="text-right">
                                    {record.cost && <p className="font-semibold text-text-light">{record.cost.toFixed(2)} ₾</p>}
                                </div>
                            </div>
                            {record.notes && <p className="mt-2 text-text-light text-sm whitespace-pre-wrap">{record.notes}</p>}
                             <div className="flex justify-end items-center space-x-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEditRecord(record)} title="რედაქტირება" className="p-2 rounded-full hover:bg-secondary">
                                    <EditIcon className="w-4 h-4 text-text-light"/>
                                </button>
                                <button onClick={() => handleDeleteRecord(record.id)} title="წაშლა" className="p-2 rounded-full hover:bg-secondary">
                                    <TrashIcon className="w-4 h-4 text-red-400"/>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ServiceLog;

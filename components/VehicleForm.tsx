import React, { useState, useEffect } from 'react';
import { decodeVin } from '../services/vinService';
import { Vehicle } from '../types';

interface VehicleFormProps {
  onSave: (vehicle: Omit<Vehicle, 'user_id' | 'vin'> & { vin: string }) => void;
  onCancel: () => void;
  existingVins: string[];
  initialData?: Vehicle | null;
}

const VehicleForm: React.FC<VehicleFormProps> = ({ onSave, onCancel, existingVins, initialData }) => {
  const isEditMode = !!initialData;

  const [vin, setVin] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState<number | ''>(new Date().getFullYear());
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [addManually, setAddManually] = useState(isEditMode);

  useEffect(() => {
    if (isEditMode && initialData) {
        setVin(initialData.vin);
        setBrand(initialData.brand);
        setModel(initialData.model);
        setYear(initialData.year);
    }
  }, [initialData, isEditMode]);


  const handleVinDecode = async () => {
    if (!vin) {
      setError('Please enter a VIN.');
      return;
    }
    if (existingVins.includes(vin.toUpperCase())) {
      setError('This vehicle has already been added.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const vehicleDetails = await decodeVin(vin);
      setBrand(vehicleDetails.brand);
      setModel(vehicleDetails.model);
      setYear(vehicleDetails.year);
    } catch (e) {
      setError((e as Error).message);
      setAddManually(true); // Allow manual entry on VIN failure
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand || !model || !(Number(year) > 1900)) {
      setError('Please fill in all vehicle details correctly.');
      return;
    }
    
    const finalVin = isEditMode && initialData ? initialData.vin : (addManually || !vin) ? `${brand}-${model}-${year}-${Math.random().toString(36).substring(2, 9)}`.toUpperCase() : vin.toUpperCase();

    if (!isEditMode && existingVins.includes(finalVin)) {
        setError('This vehicle has already been added.');
        return;
    }

    onSave({ vin: finalVin, brand, model, year: Number(year) });
  };

  return (
    <div className="p-6 bg-surface rounded-lg max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-text-main">{isEditMode ? 'მანქანის რედაქტირება' : 'ახალი მანქანის დამატება'}</h2>
      {error && <p className="bg-red-900/50 text-red-300 p-3 rounded-md mb-4">{error}</p>}
      
      {!addManually && !isEditMode && (
        <form onSubmit={(e) => { e.preventDefault(); handleVinDecode(); }}>
          <div className="mb-4">
            <label htmlFor="vin" className="block text-sm font-medium text-text-light mb-1">VIN Code</label>
            <div className="flex space-x-2">
              <input
                id="vin"
                type="text"
                value={vin}
                onChange={(e) => setVin(e.target.value)}
                placeholder="Enter VIN to auto-fill"
                className="flex-grow bg-background text-text-main border border-secondary rounded-md shadow-sm p-2 focus:ring-primary focus:border-primary"
                disabled={isLoading}
              />
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white font-semibold rounded-md hover:bg-primary-hover disabled:bg-gray-500"
                disabled={isLoading}
              >
                {isLoading ? 'Decoding...' : 'Decode'}
              </button>
            </div>
          </div>
          <p className="text-center text-text-dim my-4">or</p>
          <button type="button" onClick={() => setAddManually(true)} className="w-full text-center text-primary hover:underline">Add Manually</button>
        </form>
      )}

      {(addManually || (brand && model && year)) && (
        <form onSubmit={handleSubmit} className="space-y-4">
           {vin && <p className="text-sm text-text-dim">VIN: {vin.toUpperCase()}</p>}
          <div>
            <label htmlFor="brand" className="block text-sm font-medium text-text-light mb-1">Brand</label>
            <input id="brand" type="text" value={brand} onChange={(e) => setBrand(e.target.value)} required className="w-full bg-background text-text-main border border-secondary rounded-md p-2"/>
          </div>
          <div>
            <label htmlFor="model" className="block text-sm font-medium text-text-light mb-1">Model</label>
            <input id="model" type="text" value={model} onChange={(e) => setModel(e.target.value)} required className="w-full bg-background text-text-main border border-secondary rounded-md p-2"/>
          </div>
          <div>
            <label htmlFor="year" className="block text-sm font-medium text-text-light mb-1">Year</label>
            <input id="year" type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value) || '')} required className="w-full bg-background text-text-main border border-secondary rounded-md p-2"/>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onCancel} className="px-4 py-2 bg-secondary text-text-main font-semibold rounded-md hover:bg-opacity-80">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary text-white font-semibold rounded-md hover:bg-primary-hover">{isEditMode ? 'შენახვა' : 'Add Vehicle'}</button>
          </div>
        </form>
      )}
    </div>
  );
};

export default React.memo(VehicleForm);
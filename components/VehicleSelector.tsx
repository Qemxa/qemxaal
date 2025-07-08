import React, { useState } from 'react';
import { Vehicle, User, UserTier } from '../types';
import VehicleForm from './VehicleForm';
import { CarIcon, PlusIcon, StarIcon, CheckIcon, EditIcon, TrashIcon, UsersIcon } from './IconComponents';
import { TIER_LIMITS } from '../constants';
import toast from 'react-hot-toast';
import { supabase } from '../services/supabaseService';
import ThemeSelector from './ThemeSelector';
import { ThemeName } from '../themes';


interface VehicleSelectorProps {
  vehicles: Vehicle[];
  onSelectVehicle: (vehicle: Vehicle) => void;
  onAddVehicle: (vehicle: Omit<Vehicle, 'user_id' | 'vin'> & { vin: string }) => void;
  onUpdateVehicle: (vehicle: Vehicle) => void;
  onDeleteVehicle: (vin: string) => void;
  user: User;
  onUpdateUserProfile: (profile: Partial<User['profile']>) => void;
  appMode: 'driver' | 'partner';
  setAppMode: React.Dispatch<React.SetStateAction<'driver' | 'partner'>>;
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

const tierData: { id: UserTier; name: string; price: string; tagline: string; recommended?: boolean }[] = [
    { id: 'free', name: 'უფასო', price: '₾0', tagline: 'საბაზისო დიაგნოსტიკისთვის' },
    { id: 'premium', name: 'პრემიუმი', price: '₾55.00', tagline: 'ენთუზიასტებისთვის', recommended: true },
    { id: 'platinum', name: 'პლატინა', price: '₾100.00', tagline: 'პროფესიონალებისთვის' },
];

const tierStyles: Record<UserTier, { main: string; hover: string; text: string; bg: string; border: string; badge: string; }> = {
    free: {
        main: 'bg-secondary',
        hover: 'hover:bg-gray-600',
        text: 'text-text-light',
        bg: 'bg-surface',
        border: 'border-secondary',
        badge: 'bg-secondary text-text-light'
    },
    premium: {
        main: 'bg-amber-500',
        hover: 'hover:bg-amber-600',
        text: 'text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500',
        badge: 'bg-amber-500 text-white'
    },
    platinum: {
        main: 'bg-purple-500',
        hover: 'hover:bg-purple-600',
        text: 'text-purple-400',
        bg: 'bg-purple-500/10',
        border: 'border-purple-500',
        badge: 'bg-purple-500 text-white'
    },
}

const TierCard: React.FC<{
    tier: typeof tierData[0];
    currentTier: UserTier;
    onSelect: () => void;
    isLoading: boolean;
}> = ({ tier, currentTier, onSelect, isLoading }) => {
    const styles = tierStyles[tier.id];
    const features = TIER_LIMITS[tier.id].features;
    const isCurrent = currentTier === tier.id;
    const isUpgrade = (tier.id === 'premium' && currentTier === 'free') || (tier.id === 'platinum' && (currentTier === 'free' || currentTier === 'premium'));

    return (
        <div
            className={`relative p-5 bg-surface rounded-xl border-2 transition-all duration-300 transform-gpu ${isCurrent ? `${styles.border} shadow-lg scale-105 shadow-primary/20` : 'border-secondary hover:border-gray-500 hover:-translate-y-1'} ${isUpgrade ? 'cursor-pointer' : 'cursor-default'}`}
            onClick={isUpgrade ? onSelect : undefined}
        >
            {isCurrent && <div className={`absolute top-0 right-4 -mt-3 px-3 py-1 text-xs font-bold rounded-full ${styles.badge}`}>მიმდინარე</div>}
            {tier.recommended && !isCurrent && <div className="absolute top-0 right-4 -mt-3 px-3 py-1 text-xs font-bold rounded-full bg-primary text-white">რეკომენდებული</div>}

            <div className="flex items-start gap-4">
                {tier.id !== 'free' && <StarIcon className={`w-6 h-6 flex-shrink-0 mt-1 ${styles.text}`} />}
                <div>
                    <h3 className={`text-xl font-bold ${styles.text}`}>{tier.name}</h3>
                    <p className="text-sm text-text-dim">{tier.tagline}</p>
                </div>
            </div>
            
            <div className="mt-4">
                <span className="text-3xl font-bold text-text-main">{tier.price}</span>
                <span className="text-sm font-normal text-text-dim"> / თვე</span>
            </div>

            <ul className="mt-6 space-y-3 text-text-light text-sm min-h-[120px]">
                {features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                        <CheckIcon className={`w-4 h-4 ${styles.text} flex-shrink-0`} />
                        <span>{feature}</span>
                    </li>
                ))}
            </ul>

            <div className="mt-6">
                {isUpgrade ? (
                    <button onClick={onSelect} disabled={isLoading} className={`w-full font-bold py-2.5 rounded-lg text-white ${styles.main} ${styles.hover} transition-colors disabled:opacity-70 disabled:cursor-wait`}>
                        {isLoading ? 'გადამისამართება...' : 'პაკეტის განახლება'}
                    </button>
                ) : isCurrent ? (
                     <button disabled className="w-full font-bold py-2.5 rounded-lg text-white bg-green-600 cursor-default">
                        არჩეული პაკეტი
                    </button>
                ) : (
                    <button disabled className={`w-full font-bold py-2.5 rounded-lg text-text-main bg-surface-hover cursor-default`}>
                        პაკეტის არჩევა
                    </button>
                )}
            </div>
        </div>
    );
};


const TierSwitcher: React.FC<{ user: User; }> = ({ user }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleSelectTier = async (tierId: UserTier) => {
        if (user.profile.tier === tierId || isLoading) return;

        if (tierId === 'free') {
            toast('უფასო პაკეტზე დაბრუნება ამჟამად არ არის მხარდაჭერილი.', { icon: 'ℹ️' });
            return;
        }
        
        setIsLoading(true);
        toast.loading('გადახდის გვერდზე გადამისამართება...');

        try {
            const response = await fetch('/api/create-stripe-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tierId,
                    userId: user.id,
                    type: 'user',
                    email: user.email
                })
            });

            if (!response.ok) {
                throw new Error('გადახდის სესიის შექმნა ვერ მოხერხდა.');
            }

            const session = await response.json();

            if (session.url) {
                window.location.href = session.url;
            } else {
                throw new Error('Stripe-ის მისამართი ვერ მოიძებნა.');
            }
        } catch (error: any) {
            toast.dismiss();
            toast.error(error.message);
            setIsLoading(false);
        }
    };

    return (
        <div className="mt-12">
            <h2 className="text-2xl font-bold text-text-main text-center mb-2">აირჩიეთ თქვენთვის შესაფერისი პაკეტი</h2>
            <p className="text-text-dim text-center mb-6">განაახლეთ პაკეტი, რომ მიიღოთ მეტი შესაძლებლობები.</p>
            <div className="space-y-4">
                {tierData.map((tier) => (
                    <TierCard
                        key={tier.id}
                        tier={tier}
                        currentTier={user.profile.tier}
                        onSelect={() => handleSelectTier(tier.id)}
                        isLoading={isLoading}
                    />
                ))}
            </div>
        </div>
    );
};


const VehicleSelector: React.FC<VehicleSelectorProps> = ({ vehicles, onSelectVehicle, onAddVehicle, onUpdateVehicle, onDeleteVehicle, user, onUpdateUserProfile, appMode, setAppMode, theme, setTheme }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null);

  const vehicleLimit = TIER_LIMITS[user.profile.tier].vehicleLimit;
  const limitReached = vehicles.length >= vehicleLimit;

  const handleShowAddForm = () => {
    if (!limitReached) {
        setEditingVehicle(null);
        setShowForm(true);
    }
  };

  const handleShowEditForm = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setShowForm(true);
  }

  const handleSaveVehicle = (vehicleData: Omit<Vehicle, 'user_id' | 'vin'> & { vin: string }) => {
    if (editingVehicle) {
      onUpdateVehicle({ ...vehicleData, user_id: user.id });
    } else {
      onAddVehicle(vehicleData);
    }
    setShowForm(false);
    setEditingVehicle(null);
  };
  
  const handleCancelForm = () => {
      setShowForm(false);
      setEditingVehicle(null);
  }

  const handleDeleteConfirm = () => {
    if (deletingVehicle) {
        onDeleteVehicle(deletingVehicle.vin);
        setDeletingVehicle(null);
    }
  }

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  const styles = tierStyles[user.profile.tier];

  return (
    <div className="min-h-screen w-screen flex items-center justify-center p-4 bg-background text-text-main">
      <div className="w-full max-w-md py-8">
        
        <div className="absolute top-4 right-4 flex items-center gap-3">
           <ThemeSelector currentTheme={theme} setTheme={setTheme} />
           <div className="flex items-center gap-3 bg-surface p-2 rounded-lg">
             <span className="text-sm text-text-dim">{user.email}</span>
             <button onClick={handleLogout} className="px-3 py-1 text-sm bg-primary text-white rounded-md hover:bg-primary-hover">Logout</button>
           </div>
        </div>

        <div className="flex justify-center mb-8">
          <div className="p-1 bg-surface rounded-lg flex space-x-1 shadow-md">
            <button onClick={() => setAppMode('driver')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors w-32 ${appMode === 'driver' ? 'bg-primary text-white shadow' : 'text-text-dim hover:bg-surface-hover'}`}>
              მძღოლი
            </button>
            <button onClick={() => setAppMode('partner')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors w-32 ${appMode === 'partner' ? 'bg-primary text-white shadow' : 'text-text-dim hover:bg-surface-hover'}`}>
              პარტნიორი
            </button>
          </div>
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold">QEMXA</h1>
          <p className="text-text-light mt-2">თქვენი AI ავტო-დიაგნოსტიკის ასისტენტი</p>
        </div>

        {showForm ? (
          <VehicleForm
            onSave={handleSaveVehicle}
            onCancel={handleCancelForm}
            initialData={editingVehicle}
            existingVins={vehicles.map(v => v.vin).filter(v => v !== editingVehicle?.vin)}
          />
        ) : (
          <div>
              <div>
                  <div className="space-y-4">
                    {vehicles.length > 0 ? (
                      <ul className="space-y-3 max-h-60 overflow-y-auto p-1">
                        {vehicles.map((vehicle) => (
                          <li key={vehicle.vin} className="relative group">
                            <button
                              onClick={() => onSelectVehicle(vehicle)}
                              className="w-full text-left p-4 bg-surface rounded-lg hover:bg-surface-hover transition-colors duration-200 flex items-center space-x-4"
                            >
                              <CarIcon className={`w-8 h-8 ${styles.text} flex-shrink-0`} />
                              <div>
                                <p className="font-bold text-text-main">{`${vehicle.brand} ${vehicle.model}`}</p>
                                <p className="text-sm text-text-dim">{vehicle.year} - VIN: ...{vehicle.vin.slice(-6)}</p>
                              </div>
                            </button>
                            <div className="absolute top-1/2 -translate-y-1/2 right-3 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <button onClick={() => handleShowEditForm(vehicle)} title="რედაქტირება" className="p-2 rounded-full hover:bg-secondary">
                                  <EditIcon className="w-5 h-5 text-text-light"/>
                              </button>
                              <button onClick={() => setDeletingVehicle(vehicle)} title="წაშლა" className="p-2 rounded-full hover:bg-secondary">
                                  <TrashIcon className="w-5 h-5 text-red-400"/>
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                        <div className="text-center py-8 px-4 bg-surface rounded-lg">
                            <p className="text-text-light">მანქანები დამატებული არაა.</p>
                            <p className="text-sm text-text-dim">დაამატეთ თქვენი პირველი მანქანა დიაგნოსტიკის დასაწყებად.</p>
                        </div>
                    )}
                    <button
                      onClick={handleShowAddForm}
                      disabled={limitReached}
                      className={`w-full flex items-center justify-center p-4 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors duration-200 font-bold text-lg disabled:bg-secondary disabled:cursor-not-allowed`}
                    >
                      <PlusIcon className="w-6 h-6 mr-2" />
                      ახალი მანქანის დამატება
                    </button>
                    {limitReached && (
                        <p className="text-center text-sm text-amber-400 mt-2 px-4">
                            {user.profile.tier === 'platinum' ? 'დაგვიკავშირდით ლიმიტის გასაზრდელად.' : 'თქვენ მიაღწიეთ მანქანების ლიმიტს. მეტის დასამატებლად აირჩიეთ მაღალი პაკეტი.'}
                        </p>
                    )}
                  </div>
                  <TierSwitcher user={user} />
              </div>
          </div>
        )}
      </div>

       {deletingVehicle && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 transition-opacity">
            <div className="bg-surface p-6 rounded-lg shadow-xl max-w-sm w-full text-center animate-in fade-in-0 zoom-in-95">
                <h3 className="text-lg font-bold text-text-main">მანქანის წაშლა?</h3>
                <p className="text-text-light my-3">დარწმუნებული ხართ, რომ გსურთ წაშალოთ <br/><strong>{`${deletingVehicle.brand} ${deletingVehicle.model}`}</strong>? <br/>მთელი ჩატის ისტორია დაიკარგება.</p>
                <div className="flex justify-center space-x-4 mt-6">
                    <button onClick={() => setDeletingVehicle(null)} className="px-6 py-2 bg-secondary text-text-main font-semibold rounded-md hover:bg-opacity-80 w-full">გაუქმება</button>
                    <button onClick={handleDeleteConfirm} className="px-6 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 w-full">წაშლა</button>
                </div>
            </div>
        </div>
    )}

    </div>
  );
};

export default React.memo(VehicleSelector);
import React, { useState } from 'react';
import { PartnerProfile, User } from '../types';
import { PlusIcon, StoreIcon, UsersIcon } from './IconComponents';
import PartnerDashboard from './PartnerForm'; 
import toast from 'react-hot-toast';


interface PartnerPortalProps {
    partnerProfiles: PartnerProfile[];
    onSaveProfile: (profile: PartnerProfile) => Promise<PartnerProfile | null>;
    onDeleteProfile: (profileId: string) => Promise<boolean>;
    setAppMode: React.Dispatch<React.SetStateAction<'driver' | 'partner'>>;
    user: User;
}

const PartnerPortal: React.FC<PartnerPortalProps> = ({ partnerProfiles, onSaveProfile, onDeleteProfile, setAppMode, user }) => {
    const [selectedProfile, setSelectedProfile] = useState<PartnerProfile | null>(null);

    const handleSaveProfile = async (profile: PartnerProfile) => {
        const savedProfile = await onSaveProfile(profile);
        if (savedProfile) {
            setSelectedProfile(savedProfile);
            toast.success("პროფილი შენახულია!");
        } else {
            toast.error("პროფილის შენახვა ვერ მოხერხდა.");
        }
    };

    const handleCreateNew = () => {
        const newProfile: PartnerProfile = {
            id: `partner-${Date.now()}`,
            user_id: user.id,
            name: 'ახალი პარტნიორი',
            type: 'service',
            tier: 'free',
            description: '',
            address: '',
            phone: '',
            products: [],
            services: [],
        };
        setSelectedProfile(newProfile);
    };

    const handleDeleteProfile = async (profileId: string) => {
        if(window.confirm('დარწმუნებული ხართ რომ გსურთ ამ პროფილის და მასთან დაკავშირებული ყველა მონაცემის წაშლა?')) {
            const success = await onDeleteProfile(profileId);
            if (success) {
                setSelectedProfile(null);
                toast.success("პროფილი წაიშალა.");
            } else {
                toast.error("პროფილის წაშლა ვერ მოხერხდა.");
            }
        }
    };


    if (selectedProfile) {
        return <PartnerDashboard 
                    initialProfile={selectedProfile} 
                    onSave={handleSaveProfile} 
                    onBack={() => setSelectedProfile(null)}
                    onDelete={handleDeleteProfile}
                />
    }

    return (
        <div className="min-h-screen w-screen flex items-center justify-center p-4 bg-background text-text-main">
            <div className="w-full max-w-md py-8">
                 <div className="flex justify-center mb-8">
                  <div className="p-1 bg-surface rounded-lg flex space-x-1 shadow-md">
                    <button onClick={() => setAppMode('driver')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors w-32`}>
                      მძღოლი
                    </button>
                    <button onClick={() => setAppMode('partner')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors w-32 bg-primary text-white shadow`}>
                      პარტნიორი
                    </button>
                  </div>
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold">პარტნიორის პორტალი</h1>
                    <p className="text-text-light mt-2">მართეთ თქვენი ბიზნეს პროფილი</p>
                </div>

                <div className="space-y-4">
                    {partnerProfiles.length > 0 ? (
                        partnerProfiles.map(profile => (
                            <button key={profile.id} onClick={() => setSelectedProfile(profile)} className="w-full text-left p-4 bg-surface rounded-lg hover:bg-surface-hover transition-colors duration-200 flex items-center space-x-4">
                               <div className="p-3 bg-secondary rounded-full">
                                    <StoreIcon className="w-6 h-6 text-primary"/>
                                </div>
                                <div>
                                    <p className="font-bold text-text-main">{profile.name}</p>
                                    <p className="text-sm text-text-dim">{profile.type === 'service' ? 'სერვის ცენტრი' : 'ნაწილების მაღაზია'}</p>
                                </div>
                            </button>
                        ))
                    ) : (
                         <div className="text-center py-8 px-4 bg-surface rounded-lg">
                            <UsersIcon className="w-16 h-16 mx-auto text-text-dim" />
                            <p className="mt-4 text-text-light">პროფილები ვერ მოიძებნა.</p>
                            <p className="text-sm text-text-dim">შექმენით თქვენი პირველი ბიზნეს პროფილი.</p>
                        </div>
                    )}

                    <button
                        onClick={handleCreateNew}
                        className="w-full flex items-center justify-center p-4 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors duration-200 font-bold text-lg"
                    >
                        <PlusIcon className="w-6 h-6 mr-2" />
                        ახალი პროფილის შექმნა
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PartnerPortal;
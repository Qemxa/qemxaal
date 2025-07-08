import React, { useState, useEffect, useCallback } from 'react';
import { Vehicle, User, Chat, PartnerProfile, Message, MessageRole, UserProfile } from './types';
import VehicleSelector from './components/VehicleSelector';
import VehicleDashboard from './components/VehicleDashboard';
import PartnerPortal from './components/PartnerDirectory';
import { Toaster, toast } from 'react-hot-toast';
import { supabase, getVehicles, addVehicle, updateVehicle, deleteVehicle, getPartnerProfiles, savePartnerProfile, deletePartnerProfile, getChat, saveChat, getUserProfile, updateUserProfile } from './services/supabaseService';
import Auth from './components/Auth';
import { Session } from '@supabase/supabase-js';
import { InfoIcon } from './components/IconComponents';
import { useLocalStorage } from './hooks/useLocalStorage';
import { themes, ThemeName } from './themes';


const ConfigErrorScreen: React.FC = () => {
    return (
        <div className="h-screen w-screen flex items-center justify-center bg-background p-4">
            <div className="max-w-2xl w-full bg-surface border border-red-500/50 rounded-lg p-8 text-center shadow-2xl">
                <InfoIcon className="w-16 h-16 mx-auto text-red-400 mb-4" />
                <h1 className="text-2xl font-bold text-red-400">პროექტის კონფიგურაცია არასრულია</h1>
                <h2 className="text-xl font-bold text-red-400 mt-1">Project Configuration Incomplete</h2>
                
                <p className="text-text-light mt-6">
                    აპლიკაცია ვერ დაუკავშირდა მონაცემთა ბაზას, რადგან Supabase-ის მონაცემები არ არის მითითებული.
                    <br />
                    The application cannot connect to the database because Supabase credentials are missing.
                </p>

                <div className="mt-6 p-4 bg-background rounded-lg text-left font-mono text-sm">
                    <p className="text-text-dim">// გთხოვთ, გახსენით ფაილი:</p>
                    <p className="text-text-dim">// Please open the file:</p>
                    <p className="text-amber-400 mt-2">services/supabaseService.ts</p>

                    <p className="text-text-dim mt-4">// და ჩაანაცვლეთ ეს მნიშვნელობები თქვენი Supabase პროექტის მონაცემებით:</p>
                    <p className="text-text-dim">// And replace these placeholder values with your Supabase project credentials:</p>
                    <p className="text-white mt-2">
                        const supabaseUrl = <span className="text-red-500">'YOUR_SUPABASE_URL_PLACEHOLDER'</span>;
                        <br />
                        const supabaseAnonKey = <span className="text-red-500">'YOUR_SUPABASE_ANON_KEY_PLACEHOLDER'</span>;
                    </p>
                </div>
                
                <p className="text-text-dim mt-6 text-sm">
                    ინსტრუქციის სანახავად, თუ როგორ უნდა მოიპოვოთ ეს მონაცემები, გთხოვთ, იხილოთ PROJECT_GUIDE.md.
                    <br/>
                    For instructions on how to get these credentials, please refer to PROJECT_GUIDE.md.
                </p>
            </div>
        </div>
    );
};


const getWelcomeMessage = (vehicle: Vehicle): Message => ({
    id: `ai-welcome-${Date.now()}`,
    role: MessageRole.AI,
    content: `გამარჯობა! მე ვარ QEMXA, თქვენი პერსონალური AI დიაგნოსტიკის ასისტენტი. მე დაგეხმარებით თქვენი ${vehicle.year} ${vehicle.brand} ${vehicle.model}-ის პრობლემის გარკვევაში. \n\nროგორ შემიძლია დაგეხმაროთ დღეს?`,
    createdAt: new Date().toISOString()
});

const createNewChat = (vehicle: Vehicle): Chat => ({
    vin: vehicle.vin,
    user_id: vehicle.user_id,
    messages: [getWelcomeMessage(vehicle)],
    serviceHistory: []
});

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [partnerProfiles, setPartnerProfiles] = useState<PartnerProfile[]>([]);
  const [appMode, setAppMode] = useState<'driver' | 'partner'>('driver');
  const [isLoading, setIsLoading] = useState(true);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [chatsCache, setChatsCache] = useState<Record<string, Chat>>({});

  const [theme, setTheme] = useLocalStorage<ThemeName>('qemxa-theme', 'dark-blue');

  useEffect(() => {
    const themeObject = themes[theme];
    const root = document.documentElement;
    let themeStyles = ':root {\n';
    for (const [key, value] of Object.entries(themeObject)) {
      themeStyles += `  ${key}: ${value};\n`;
    }
    themeStyles += '}';
    const styleTag = document.getElementById('app-theme');
    if (styleTag) {
        styleTag.innerHTML = themeStyles;
    }
  }, [theme]);

  const fetchUserData = useCallback(async (currentSession: Session) => {
    if (!currentSession.user) return;
    setIsLoading(true);
    try {
        const [profileData, vehiclesData, partnersData] = await Promise.all([
            getUserProfile(currentSession.user.id),
            getVehicles(currentSession.user.id),
            getPartnerProfiles(currentSession.user.id),
        ]);
        
        setUser({ ...currentSession.user, profile: profileData });
        setVehicles(vehiclesData);
        setPartnerProfiles(partnersData);

    } catch (error) {
        toast.error("მონაცემების ჩატვირთვისას მოხდა შეცდომა.");
        console.error(error);
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
        setIsLoading(false);
        return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserData(session);
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session) {
          fetchUserData(session);
        } else {
          setUser(null);
          setVehicles([]);
          setSelectedVehicle(null);
          setPartnerProfiles([]);
          setCurrentChat(null);
          setChatsCache({});
          setIsLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchUserData]);

  const handleSelectVehicle = useCallback(async (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);

    if (chatsCache[vehicle.vin]) {
      setCurrentChat(chatsCache[vehicle.vin]);
      return;
    }

    let existingChat = await getChat(vehicle.vin, vehicle.user_id);
    if (!existingChat) {
      existingChat = createNewChat(vehicle);
      await saveChat(existingChat);
    }
    setCurrentChat(existingChat);
    setChatsCache(prev => ({ ...prev, [vehicle.vin]: existingChat! }));
  }, [chatsCache]);

  const handleAddVehicle = useCallback(async (vehicle: Omit<Vehicle, 'user_id' | 'vin'> & {vin: string}) => {
    if (!user) return;
    const newVehicleData: Vehicle = { ...vehicle, user_id: user.id };
    const newVehicle = await addVehicle(newVehicleData);
    if(newVehicle) {
        setVehicles(prev => [...prev, newVehicle]);
        handleSelectVehicle(newVehicle);
    }
  }, [user, handleSelectVehicle]);

  const handleUpdateVehicle = useCallback(async (updatedVehicle: Vehicle) => {
    const success = await updateVehicle(updatedVehicle);
    if(success) {
        setVehicles(prev => prev.map(v => v.vin === updatedVehicle.vin ? updatedVehicle : v));
        if(selectedVehicle?.vin === updatedVehicle.vin) {
            setSelectedVehicle(updatedVehicle);
        }
    }
  }, [selectedVehicle?.vin]);
  
  const handleDeleteVehicle = useCallback(async (vinToDelete: string) => {
    if (!user) return;
    const success = await deleteVehicle(vinToDelete, user.id);
    if(success) {
        setVehicles(prev => prev.filter(v => v.vin !== vinToDelete));
        setChatsCache(prev => {
            const newCache = {...prev};
            delete newCache[vinToDelete];
            return newCache;
        });
        if (selectedVehicle?.vin === vinToDelete) {
          setSelectedVehicle(null);
          setCurrentChat(null);
        }
        toast.success('მანქანა და მისი ჩატის ისტორია წაიშალა.');
    }
  }, [user, selectedVehicle?.vin]);

  const handleUpdateUserProfile = useCallback(async (profileUpdate: Partial<UserProfile>) => {
    if(!user) return;
    const updatedProfile = await updateUserProfile(user.id, profileUpdate);
    if (updatedProfile) {
        setUser(prevUser => prevUser ? { ...prevUser, profile: updatedProfile } : null);
    }
  }, [user]);
  
  const handleSavePartnerProfile = useCallback(async (profile: PartnerProfile) => {
      const savedProfile = await savePartnerProfile(profile);
      if (savedProfile) {
          setPartnerProfiles(prev => {
              const exists = prev.some(p => p.id === savedProfile.id);
              if (exists) {
                  return prev.map(p => p.id === savedProfile.id ? savedProfile : p);
              }
              return [...prev, savedProfile];
          });
      }
      return savedProfile;
  }, []);

  const handleDeletePartnerProfile = useCallback(async (profileId: string) => {
      if (!user) return false;
      const success = await deletePartnerProfile(profileId, user.id);
      if (success) {
          setPartnerProfiles(prev => prev.filter(p => p.id !== profileId));
      }
      return success;
  }, [user]);
  
  const handleUpdateChat = useCallback(async (chat: Chat) => {
    setCurrentChat(chat);
    setChatsCache(prev => ({ ...prev, [chat.vin]: chat }));
    await saveChat(chat);
  }, []);
  
  const handleBackToSelector = useCallback(() => {
    setSelectedVehicle(null);
    setCurrentChat(null);
  }, []);
  
  if (!supabase) {
      return <ConfigErrorScreen />;
  }

  if (isLoading) {
      return (
          <div className="h-screen w-screen flex items-center justify-center bg-background">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
      );
  }

  return (
    <>
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: 'rgb(var(--color-surface))',
            color: 'rgb(var(--color-text-main))',
          },
          duration: 3000,
        }}
      />
      <div className="antialiased text-text-main">
        {!session || !user ? (
            <Auth />
        ) : appMode === 'driver' ? (
          selectedVehicle && currentChat ? (
            <VehicleDashboard 
                vehicle={selectedVehicle} 
                onBack={handleBackToSelector} 
                user={user}
                onUpdateUserProfile={handleUpdateUserProfile}
                partnerProfiles={partnerProfiles}
                chat={currentChat}
                onUpdateChat={handleUpdateChat}
            />
          ) : (
            <VehicleSelector
              vehicles={vehicles}
              onSelectVehicle={handleSelectVehicle}
              onAddVehicle={handleAddVehicle}
              onUpdateVehicle={handleUpdateVehicle}
              onDeleteVehicle={handleDeleteVehicle}
              user={user}
              onUpdateUserProfile={handleUpdateUserProfile}
              appMode={appMode}
              setAppMode={setAppMode}
              theme={theme}
              setTheme={setTheme}
            />
          )
        ) : (
           <PartnerPortal
             partnerProfiles={partnerProfiles}
             onSaveProfile={handleSavePartnerProfile}
             onDeleteProfile={handleDeletePartnerProfile}
             setAppMode={setAppMode}
             user={user}
           />
        )}
      </div>
    </>
  );
};

export default App;
import React, { useState, useCallback } from 'react';
import { Vehicle, Chat, User, UserTier, Message, MessageRole, PartnerProfile, UserProfile } from '../types';
import { BackIcon, AiIcon, WrenchScrewdriverIcon, TrashIcon, StarIcon } from './IconComponents';
import ChatView from './ChatView';
import ServiceLog from './ServiceLog';
import { TIER_LIMITS } from '../constants';
import { toast } from 'react-hot-toast';
import { getAiResponse } from '../services/geminiService';

const ToggleSwitch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; }> = ({ checked, onChange }) => (
    <button
      type="button"
      className={`${checked ? 'bg-primary' : 'bg-secondary'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface`}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
    >
      <span
        aria-hidden="true"
        className={`${checked ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
      />
    </button>
);

type ActiveTab = 'chat' | 'service';

interface VehicleDashboardProps {
  vehicle: Vehicle;
  onBack: () => void;
  user: User;
  onUpdateUserProfile: (profileUpdate: Partial<UserProfile>) => void;
  partnerProfiles: PartnerProfile[];
  chat: Chat;
  onUpdateChat: (chat: Chat) => void;
}

const VehicleDashboard: React.FC<VehicleDashboardProps> = ({ vehicle, onBack, user, onUpdateUserProfile, partnerProfiles, chat, onUpdateChat }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [isLoading, setIsLoading] = useState(false);
  const [useGoogleSearch, setUseGoogleSearch] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  const userProfile = user.profile;
  const today = new Date().toISOString().split('T')[0];
  const queryLimit = TIER_LIMITS[userProfile.tier].queryLimit;
  const remainingQueries = userProfile.dailyUsage.date === today ? queryLimit - userProfile.dailyUsage.count : queryLimit;

  const incrementUsage = () => {
    const newUsageCount = userProfile.dailyUsage.date === today ? userProfile.dailyUsage.count + 1 : 1;
    onUpdateUserProfile({ dailyUsage: { date: today, count: newUsageCount } });
  }

  const handleSendMessage = async (content: string, image?: string) => {
    if (remainingQueries <= 0) {
      toast.error(`თქვენ ამოწურეთ დღიური ლიმიტი: ${queryLimit} შეტყობინება.`);
      return;
    }

    setIsLoading(true);

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: MessageRole.USER,
      content,
      imageUrl: image,
      createdAt: new Date().toISOString()
    };
    
    const updatedMessages = [...chat.messages, userMessage];
    const optimisticChat = { ...chat, messages: updatedMessages };
    onUpdateChat(optimisticChat); // Optimistic update

    try {
      const { text, sources } = await getAiResponse(vehicle, updatedMessages, useGoogleSearch, partnerProfiles);
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        role: MessageRole.AI,
        content: text,
        groundingSources: sources,
        createdAt: new Date().toISOString()
      };
      
      const finalChat = { ...chat, messages: [...updatedMessages, aiMessage] };
      onUpdateChat(finalChat);
      incrementUsage();

    } catch (error) {
        toast.error("ბოდიში, რაღაც შეცდომა მოხდა.");
        onUpdateChat(chat); // Revert optimistic update
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    const messageIndex = chat.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    let messagesToDeleteCount = 1;
    const message = chat.messages[messageIndex];
    
    if (
      message.role === MessageRole.USER &&
      messageIndex + 1 < chat.messages.length &&
      chat.messages[messageIndex + 1].role === MessageRole.AI
    ) {
      messagesToDeleteCount = 2;
    }
    
    const updatedMessages = [...chat.messages];
    updatedMessages.splice(messageIndex, messagesToDeleteCount);
    onUpdateChat({ ...chat, messages: updatedMessages });
  };
  
  const handleRegenerateResponse = async (aiMessageId: string) => {
    if (remainingQueries <= 0) {
      toast.error(`თქვენ ამოწურეთ დღიური ლიმიტი.`);
      return;
    }
    
    const messageIndex = chat.messages.findIndex(m => m.id === aiMessageId);
    if (messageIndex < 1 || chat.messages[messageIndex].role !== MessageRole.AI) return;

    const historyToResend = chat.messages.slice(0, messageIndex);
    if (historyToResend.length === 0 || historyToResend[historyToResend.length - 1].role !== MessageRole.USER) return;

    setIsLoading(true);
    const optimisticChat = { ...chat, messages: historyToResend };
    onUpdateChat(optimisticChat);

    try {
      const { text, sources } = await getAiResponse(vehicle, historyToResend, useGoogleSearch, partnerProfiles);
      const newAiMessage: Message = { id: `ai-${Date.now()}`, role: MessageRole.AI, content: text, groundingSources: sources, createdAt: new Date().toISOString() };
      onUpdateChat({ ...chat, messages: [...historyToResend, newAiMessage] });
      incrementUsage();
    } catch (error) {
      toast.error("პასუხის ხელახლა გენერირება ვერ მოხერხდა.");
      onUpdateChat(chat); // Revert
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    if (remainingQueries <= 0) {
        toast.error(`თქვენ ამოწურეთ დღიური ლიმიტი.`);
        return;
    }

    const messageIndex = chat.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1 || chat.messages[messageIndex].role !== MessageRole.USER) return;
    
    const updatedHistory = chat.messages.slice(0, messageIndex + 1).map((msg, index) => 
      index === messageIndex ? { ...msg, content: newContent } : msg
    );
    
    setIsLoading(true);
    const optimisticChat = { ...chat, messages: updatedHistory };
    onUpdateChat(optimisticChat);

    try {
        const { text, sources } = await getAiResponse(vehicle, updatedHistory, useGoogleSearch, partnerProfiles);
        const aiMessage: Message = { id: `ai-${Date.now()}`, role: MessageRole.AI, content: text, groundingSources: sources, createdAt: new Date().toISOString() };
        onUpdateChat({ ...chat, messages: [...updatedHistory, aiMessage] });
        incrementUsage();
    } catch (error) {
        toast.error("შეტყობინების რედაქტირების შემდეგ პასუხის მიღება ვერ მოხერხდა.");
        onUpdateChat(chat); // Revert to original on error
    } finally {
        setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    const welcomeMessage: Message = {
        id: `ai-welcome-${Date.now()}`,
        role: MessageRole.AI,
        content: `გამარჯობა! მე ვარ QEMXA, თქვენი პერსონალური AI დიაგნოსტიკის ასისტენტი. მე დაგეხმარებით თქვენი ${vehicle.year} ${vehicle.brand} ${vehicle.model}-ის პრობლემის გარკვევაში. \n\nროგორ შემიძლია დაგეხმაროთ დღეს?`,
        createdAt: new Date().toISOString()
    };
    onUpdateChat({ ...chat, messages: [welcomeMessage] });
    setShowClearConfirm(false);
    toast.success("ჩატის ისტორია გასუფთავდა");
  };

  const tierDisplay: Record<UserTier, { label: string; style: string; }> = {
      free: { label: 'უფასო', style: 'bg-primary/20 text-blue-300'},
      premium: { label: 'პრემიუმი', style: 'bg-amber-500/20 text-amber-300'},
      platinum: { label: 'პლატინა', style: 'bg-purple-500/20 text-purple-300'},
  }
  
  const canAccessServiceHistory = userProfile.tier === 'platinum';

  const handleTabClick = (tab: ActiveTab) => {
    if (tab === 'service' && !canAccessServiceHistory) {
      toast.error('სერვისის ისტორია ხელმისაწვდომია მხოლოდ Platinum პაკეტზე.');
      return;
    }
    setActiveTab(tab);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-background">
      <header className="flex items-center p-3 sm:p-4 bg-surface border-b border-secondary shadow-sm z-10 gap-2 sm:gap-3">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-surface-hover flex-shrink-0">
          <BackIcon className="w-6 h-6 text-text-main" />
        </button>
        <div className="flex-grow">
          <h1 className="text-lg font-bold text-text-main truncate">{`${vehicle.brand} ${vehicle.model}`}</h1>
          <p className="text-sm text-text-dim">{vehicle.year}</p>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
           <div className="flex items-center gap-2">
                <label htmlFor="google-search-toggle" className="text-sm text-text-dim font-medium hidden sm:block">Google ძიება</label>
                <ToggleSwitch checked={useGoogleSearch} onChange={setUseGoogleSearch} />
            </div>

             <button onClick={() => setShowClearConfirm(true)} title="ისტორიის გასუფთავება" className="p-2 rounded-full hover:bg-surface-hover">
                <TrashIcon className="w-5 h-5 text-text-dim hover:text-red-400"/>
            </button>

            <div className="text-right space-y-1">
                 <div className={`rounded-full px-3 py-1 text-xs font-semibold flex items-center justify-center gap-1.5 w-fit ml-auto ${tierDisplay[userProfile.tier].style}`}>
                   {userProfile.tier === 'premium' && <StarIcon className="w-3 h-3 text-amber-400" />}
                   {userProfile.tier === 'platinum' && <StarIcon className="w-3 h-3 text-purple-400 fill-purple-400" />}
                   {tierDisplay[userProfile.tier].label}
                </div>
                <div className="text-xs text-text-dim">
                   <span>{remainingQueries > 0 ? remainingQueries : 0}</span>
                   <span> შეტყობინება</span>
                </div>
            </div>
        </div>
      </header>

      <div className="border-b border-secondary">
          <nav className="flex justify-center -mb-px">
              <button onClick={() => handleTabClick('chat')} className={`py-3 px-6 text-sm font-medium border-b-2 flex items-center gap-2 ${activeTab === 'chat' ? 'border-primary text-primary' : 'border-transparent text-text-dim hover:text-text-light hover:border-gray-500'}`}>
                  <AiIcon className="w-5 h-5" />
                  AI დიაგნოსტიკა
              </button>
              <button 
                onClick={() => handleTabClick('service')} 
                className={`py-3 px-6 text-sm font-medium border-b-2 flex items-center gap-2 ${activeTab === 'service' ? 'border-purple-500 text-purple-400' : 'border-transparent text-text-dim hover:text-text-light hover:border-gray-500'} ${!canAccessServiceHistory ? 'cursor-not-allowed opacity-60' : ''}`}
                title={!canAccessServiceHistory ? "ხელმისაწვდომია Platinum პაკეტზე" : ""}
              >
                  <WrenchScrewdriverIcon className="w-5 h-5" />
                  სერვისის ისტორია
                  {!canAccessServiceHistory && <StarIcon className="w-4 h-4 ml-1 text-purple-400 fill-purple-400" />}
              </button>
          </nav>
      </div>

      <main className="flex-1 overflow-y-auto">
        {activeTab === 'chat' && (
          <ChatView 
            vehicle={vehicle} 
            user={user} 
            messages={chat.messages}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
            onDeleteMessage={handleDeleteMessage}
            onEditMessage={handleEditMessage}
            onRegenerateResponse={handleRegenerateResponse}
          />
        )}
        {activeTab === 'service' && canAccessServiceHistory && (
          <ServiceLog 
            chat={chat} 
            onSave={onUpdateChat}
          />
        )}
      </main>

       {showClearConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 transition-opacity">
            <div className="bg-surface p-6 rounded-lg shadow-xl max-w-sm w-full text-center animate-in fade-in-0 zoom-in-95">
                <h3 className="text-lg font-bold text-text-main">ისტორიის გასუფთავება?</h3>
                <p className="text-text-light my-3">დარწმუნებული ხართ, რომ გსურთ ამ ჩატის ყველა შეტყობინების წაშლა? ამ მოქმედების გაუქმება შეუძლებელია.</p>
                <div className="flex justify-center space-x-4 mt-6">
                    <button onClick={() => setShowClearConfirm(false)} className="px-6 py-2 bg-secondary text-text-main font-semibold rounded-md hover:bg-opacity-80 w-full">გაუქმება</button>
                    <button onClick={handleClearChat} className="px-6 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 w-full">გასუფთავება</button>
                </div>
            </div>
        </div>
    )}
    </div>
  );
};

export default VehicleDashboard;
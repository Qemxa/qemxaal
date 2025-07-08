import React, { useEffect, useRef } from 'react';
import { Vehicle, Message, User, PartnerProfile } from '../types';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import { AiIcon } from './IconComponents';
import { TIER_LIMITS } from '../constants';

interface ChatViewProps {
  vehicle: Vehicle;
  user: User;
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (content: string, image?: string) => Promise<void>;
  onDeleteMessage: (messageId: string) => void;
  onEditMessage: (messageId: string, newContent: string) => Promise<void>;
  onRegenerateResponse: (aiMessageId: string) => Promise<void>;
}

const ChatView: React.FC<ChatViewProps> = ({
  vehicle,
  user,
  messages,
  isLoading,
  onSendMessage,
  onDeleteMessage,
  onEditMessage,
  onRegenerateResponse
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const today = new Date().toISOString().split('T')[0];
  const queryLimit = TIER_LIMITS[user.profile.tier].queryLimit;
  const usage = user.profile.dailyUsage;
  const limitReached = usage.date === today && usage.count >= queryLimit;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  return (
    <div className="h-full w-full flex flex-col bg-background">
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="space-y-6 max-w-4xl mx-auto">
          {messages.map(msg => 
            <MessageBubble 
              key={msg.id} 
              message={msg}
              onDelete={onDeleteMessage}
              onEdit={onEditMessage}
              onRegenerate={onRegenerateResponse}
            />
          )}
          {isLoading && (
             <div className="flex items-start gap-3 justify-start">
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0 self-start shadow-md">
                  <AiIcon className="w-5 h-5 text-white" />
                </div>
                <div className="max-w-2xl rounded-2xl px-4 py-3 shadow-md bg-surface text-text-light rounded-bl-lg flex items-center space-x-2">
                   <div className="w-2 h-2 bg-text-dim rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                   <div className="w-2 h-2 bg-text-dim rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                   <div className="w-2 h-2 bg-text-dim rounded-full animate-bounce"></div>
                </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>
      <MessageInput onSendMessage={onSendMessage} isLoading={isLoading} limitReached={limitReached} user={user} />
    </div>
  );
};

export default ChatView;
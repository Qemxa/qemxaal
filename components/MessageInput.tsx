import React, { useState, useRef } from 'react';
import { SendIcon, ImageIcon } from './IconComponents';
import { User } from '../types';
import { TIER_LIMITS } from '../constants';

interface MessageInputProps {
  onSendMessage: (content: string, image?: string) => void;
  isLoading: boolean;
  limitReached: boolean;
  user: User;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, isLoading, limitReached, user }) => {
  const [content, setContent] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const charLimit = TIER_LIMITS[user.profile.tier].queryCharLimit;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((content.trim() || image) && !isLoading && !limitReached) {
      onSendMessage(content.trim(), image || undefined);
      setContent('');
      setImage(null);
      if(fileInputRef.current) fileInputRef.current.value = "";
    }
  };
  
  const charCountColor = () => {
    const percentage = (content.length / charLimit) * 100;
    if (percentage >= 100) return 'text-red-500';
    if (percentage >= 90) return 'text-amber-400';
    return 'text-text-dim';
  }

  return (
    <div className="bg-surface border-t border-secondary">
        {image && (
            <div className="p-2 px-4 relative w-fit">
                <img src={image} alt="Upload preview" className="h-20 rounded-md" />
                <button
                    onClick={() => {
                      setImage(null)
                      if(fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="absolute top-0 right-0 -mt-1 -mr-1 bg-secondary text-text-light rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold"
                >&times;</button>
            </div>
        )}
        <form onSubmit={handleSubmit} className="flex items-center space-x-3 p-4">
          {user.profile.tier === 'platinum' && (
              <>
                  <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 text-text-dim hover:text-primary transition-colors"
                      title="სურათის დამატება"
                      disabled={isLoading || limitReached}
                  >
                      <ImageIcon className="w-6 h-6" />
                  </button>
                  <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                  />
              </>
          )}
          <div className="flex-grow relative">
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={limitReached ? "დღიური ლიმიტი ამოწურულია" : "აღწერეთ პრობლემა..."}
              className="w-full bg-background text-text-main border border-secondary rounded-full py-3 px-5 focus:outline-none focus:ring-2 focus:ring-primary pr-24"
              disabled={isLoading || limitReached}
              maxLength={charLimit}
            />
            <div className={`absolute inset-y-0 right-0 flex items-center pr-6 text-sm pointer-events-none ${charCountColor()}`}>
                {content.length}/{charLimit}
            </div>
          </div>
          <button
            type="submit"
            className="bg-primary text-white rounded-full p-3 hover:bg-primary-hover disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
            disabled={isLoading || (!content.trim() && !image) || limitReached}
          >
            {isLoading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
                <SendIcon className="w-6 h-6" />
            )}
          </button>
        </form>
    </div>
  );
};

export default MessageInput;
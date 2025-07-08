import React, { useState } from 'react';
import { Message, MessageRole } from '../types';
import { AiIcon, UserIcon, EditIcon, TrashIcon, RefreshIcon, LinkIcon } from './IconComponents';

interface MessageBubbleProps {
  message: Message;
  onDelete: (messageId: string) => void;
  onEdit: (messageId: string, newContent: string) => void;
  onRegenerate: (aiMessageId: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onDelete, onEdit, onRegenerate }) => {
  const isUser = message.role === MessageRole.USER;
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);

  const handleSaveEdit = () => {
    if (editedContent.trim() && editedContent.trim() !== message.content) {
      onEdit(message.id, editedContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedContent(message.content);
    setIsEditing(false);
  };

  const formatContent = (content: string) => {
    // Escape basic HTML to prevent injection
    let safeContent = content.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    
    const html = safeContent
        .replace(/```([\s\S]*?)```/g, (match, code) => `<pre class="bg-background p-3 rounded-md my-2 text-sm overflow-x-auto"><code>${code.trim()}</code></pre>`)
        .replace(/^\s*[-*]\s(.*)/gm, '<li class="ml-4 list-disc">$1</li>') // Unordered list items
        .replace(/^\s*\d+\.\s(.*)/gm, '<li class="ml-4 list-decimal">$1</li>') // Ordered list items
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
        .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italics
        .replace(/`([^`]+)`/g, '<code class="bg-background text-text-light px-1.5 py-0.5 rounded-md">$1</code>') // Inline code
        .replace(/<strong>(პრობლემის შეჯამება:|სავარაუდო დიაგნოზი:|რეკომენდაციები:)<\/strong>/g, '<h3 class="text-md font-semibold text-text-main mt-3 mb-1">$1</h3>')
        .split('\n').map(line => {
            if (line.startsWith('<li') || line.startsWith('<pre') || line.startsWith('</pre')) {
                return line;
            }
            return line + '<br>';
        }).join('').replace(/<br>$/, '');

    return { __html: html };
  };

  const canEdit = isUser && !message.imageUrl;

  return (
    <div className={`group flex w-full items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0 self-start shadow-md">
          <AiIcon className="w-5 h-5 text-white" />
        </div>
      )}

      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`max-w-2xl rounded-2xl shadow-md ${
            isUser
              ? 'bg-primary text-white rounded-br-lg'
              : 'bg-surface text-text-light rounded-bl-lg'
          } ${message.imageUrl && message.content ? 'p-2' : 'px-4 py-3'}`}
        >
          {isEditing ? (
            <div className="w-full" style={{minWidth: '24rem'}}>
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full bg-background text-text-main border border-secondary rounded-md p-2 text-sm focus:ring-primary focus:border-primary"
                rows={4}
              />
              <div className="flex justify-end space-x-2 mt-2">
                <button onClick={handleCancelEdit} className="px-3 py-1 text-xs bg-secondary text-text-main font-semibold rounded-md hover:bg-opacity-80">გაუქმება</button>
                <button onClick={handleSaveEdit} className="px-3 py-1 text-xs bg-primary text-white font-semibold rounded-md hover:bg-primary-hover">შენახვა</button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
               {message.imageUrl && (
                  <img src={message.imageUrl} alt="User upload" className="max-w-xs md:max-w-sm rounded-lg" />
              )}
              {message.content && (
                <div 
                  className={`prose prose-sm text-inherit leading-relaxed ${message.imageUrl && message.content ? 'p-2' : ''}`}
                  dangerouslySetInnerHTML={formatContent(message.content)} 
                />
              )}
              {message.groundingSources && message.groundingSources.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-secondary/50">
                      <h4 className="text-xs font-semibold text-text-dim mb-2">წყაროები:</h4>
                      <ul className="space-y-1.5">
                          {message.groundingSources.map((source, index) => (
                              <li key={index}>
                                  <a href={source.uri} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 text-primary text-sm hover:underline">
                                      <LinkIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                      <span className="truncate">{source.title || new URL(source.uri).hostname}</span>
                                  </a>
                              </li>
                          ))}
                      </ul>
                  </div>
              )}
            </div>
          )}
        </div>
        
        {!isEditing && (
            <div className="flex items-center space-x-2 mt-1.5 text-text-dim opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {isUser ? (
                    <>
                        {canEdit && (
                            <button onClick={() => setIsEditing(true)} title="შეცვლა" className="p-1 rounded-full hover:bg-surface-hover">
                                <EditIcon className="w-4 h-4 hover:text-text-light" />
                            </button>
                        )}
                        <button onClick={() => onDelete(message.id)} title="წაშლა" className="p-1 rounded-full hover:bg-surface-hover">
                            <TrashIcon className="w-4 h-4 hover:text-red-400" />
                        </button>
                    </>
                ) : (
                    <>
                        <button onClick={() => onRegenerate(message.id)} title="ხელახლა გენერირება" className="p-1 rounded-full hover:bg-surface-hover">
                            <RefreshIcon className="w-4 h-4 hover:text-text-light" />
                        </button>
                        <button onClick={() => onDelete(message.id)} title="წაშლა" className="p-1 rounded-full hover:bg-surface-hover">
                            <TrashIcon className="w-4 h-4 hover:text-red-400" />
                        </button>
                    </>
                )}
            </div>
        )}
      </div>

      {isUser && (
        <div className="w-9 h-9 rounded-full bg-surface flex items-center justify-center flex-shrink-0 self-start shadow-md">
          <UserIcon className="w-5 h-5 text-text-dim" />
        </div>
      )}
    </div>
  );
};

export default React.memo(MessageBubble);
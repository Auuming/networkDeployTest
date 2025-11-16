import { useState, useEffect, useRef, useCallback } from "react";
import { Socket } from "socket.io-client";
import { ActiveChat, Message } from "../types";
import formatText from "../utils/formatText";

interface ChatRoomProps {
  readonly chat: ActiveChat;
  readonly messages: Message[];
  readonly onSendMessage: (message: string) => void;
  readonly currentClientName: string;
  readonly socket: Socket;
  readonly currentSocketId: string;
  readonly typingUsers: string[];
}

function ChatRoom({
  chat,
  messages,
  onSendMessage,
  currentClientName: _currentClientName,
  socket,
  currentSocketId,
  typingUsers,
}: ChatRoomProps) {
  const [inputMessage, setInputMessage] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef<boolean>(false);
  const previousChatRef = useRef<ActiveChat | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  const handleTypingStart = useCallback(() => {
    if (isTypingRef.current) return; // Already typing
    
    isTypingRef.current = true;
    
    if (chat.type === 'private') {
      socket.emit('privateTypingStart', { recipientId: chat.id });
    } else if (chat.type === 'group') {
      socket.emit('groupTypingStart', { groupId: chat.id });
    }
  }, [chat, socket]);

  const handleTypingStop = useCallback(() => {
    if (!isTypingRef.current) return; // Not typing
    
    isTypingRef.current = false;
    
    if (chat.type === 'private') {
      socket.emit('privateTypingStop', { recipientId: chat.id });
    } else if (chat.type === 'group') {
      socket.emit('groupTypingStop', { groupId: chat.id });
    }
  }, [chat, socket]);

  // Cleanup typing timeout on unmount or chat change
  useEffect(() => {
    // Stop typing for previous chat if it exists
    if (previousChatRef.current && isTypingRef.current) {
      const prevChat = previousChatRef.current;
      if (prevChat.type === 'private') {
        socket.emit('privateTypingStop', { recipientId: prevChat.id });
      } else if (prevChat.type === 'group') {
        socket.emit('groupTypingStop', { groupId: prevChat.id });
      }
    }
    
    // Reset typing state when chat changes
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    isTypingRef.current = false;
    previousChatRef.current = chat;
    
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Stop typing on unmount
      if (isTypingRef.current) {
        if (chat.type === 'private') {
          socket.emit('privateTypingStop', { recipientId: chat.id });
        } else if (chat.type === 'group') {
          socket.emit('groupTypingStop', { groupId: chat.id });
        }
      }
    };
  }, [chat, socket]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputMessage(value);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // If user is typing, emit typing start
    if (value.trim().length > 0) {
      handleTypingStart();
      
      // Set timeout to stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        handleTypingStop();
      }, 2000);
    } else {
      // If input is empty, stop typing immediately
      handleTypingStop();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      // Stop typing when message is sent
      handleTypingStop();
      onSendMessage(inputMessage);
      setInputMessage("");
    }
  };

  const handleInputBlur = () => {
    // Stop typing when input loses focus
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    handleTypingStop();
  };

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleDoubleClick = (msg: Message) => {
    if (!msg.messageId) return;

    const emoji = "❤️";
    const roomId =
      chat.type === "private"
        ? [currentSocketId, chat.id]
            .sort((a, b) => a.localeCompare(b))
            .join("-")
        : undefined;
    const groupId = chat.type === "group" ? chat.id : undefined;

    const hasReacted = msg.reactions?.[emoji]?.includes(currentSocketId);

    if (hasReacted) {
      socket.emit("removeReaction", {
        messageId: msg.messageId,
        emoji,
        roomId,
        groupId,
      });
    } else {
      socket.emit("addReaction", {
        messageId: msg.messageId,
        emoji,
        roomId,
        groupId,
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5] dark:bg-gray-900">
      <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3 bg-white dark:bg-gray-900">
        <h2 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-200 flex-1">
          {chat.type === "private" ? "🔒" : "💬"} {chat.name}
        </h2>
        <span className="px-3 py-1 rounded-xl text-[11px] md:text-xs font-semibold bg-[#00C300] dark:bg-gray-700 text-white">
          {chat.type === "group" ? "Group Chat" : "Private Chat"}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 bg-[#F5F5F5] dark:bg-gray-900">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm md:text-base">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg, index) => {
            const messageKey = msg.messageId || `${msg.timestamp}-${index}`;
            const hasReactions =
              msg.reactions && Object.keys(msg.reactions).length > 0;

            return (
              <div
                key={messageKey}
                className={`max-w-[70%] md:max-w-[70%] flex flex-col gap-1 ${
                  msg.isOwn ? "self-end" : "self-start"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`font-bold text-xs md:text-sm ${
                      msg.isOwn ? "text-[#00C300] dark:text-[#00E676]" : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {msg.sender}
                  </span>
                  {msg.isOwn && (
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 italic">
                      You
                    </span>
                  )}
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 ml-auto">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
                <button
                  type="button"
                  onDoubleClick={() => handleDoubleClick(msg)}
                  className={`px-4 py-3 rounded-xl text-sm md:text-base leading-relaxed break-words cursor-pointer transition-opacity hover:opacity-90 text-left w-full border ${
                    msg.isOwn
                      ? "bg-[#DCF8C6] dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 rounded-br-sm shadow-sm"
                      : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 rounded-bl-sm"
                  }`}
                  title="Double-click to react"
                >
                  {formatText(msg.message)}
                </button>
                {hasReactions && (
                  <div
                    className={`flex flex-wrap gap-1.5 mt-1 ${
                      msg.isOwn ? "justify-end" : "justify-start"
                    }`}
                  >
                    {Object.entries(msg.reactions || {}).map(
                      ([emoji, socketIds]) => {
                        const hasUserReacted =
                          socketIds.includes(currentSocketId);
                        return (
                          <div
                            key={emoji}
                            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                              hasUserReacted
                                ? "bg-red-500/20 dark:bg-red-500/30 border border-red-500/50 dark:border-red-500/60"
                                : "bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
                            }`}
                          >
                            <span className="text-sm">{emoji}</span>
                            <span className="text-gray-600 dark:text-gray-300 text-[10px]">
                              {socketIds.length}
                            </span>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
        
        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="self-start max-w-[70%] md:max-w-[70%] flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-[#00C300] dark:bg-[#00E676] rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1.4s' }}></div>
              <div className="w-2 h-2 bg-[#00C300] dark:bg-[#00E676] rounded-full animate-bounce" style={{ animationDelay: '200ms', animationDuration: '1.4s' }}></div>
              <div className="w-2 h-2 bg-[#00C300] dark:bg-[#00E676] rounded-full animate-bounce" style={{ animationDelay: '400ms', animationDuration: '1.4s' }}></div>
            </div>
            <span className="text-[#00C300] dark:text-[#00E676] text-sm italic font-medium">
              {typingUsers.length === 1 
                ? `${typingUsers[0]} is typing...`
                : typingUsers.length === 2
                ? `${typingUsers[0]} and ${typingUsers[1]} are typing...`
                : `${typingUsers[0]} and ${typingUsers.length - 1} others are typing...`
              }
            </span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-5 border-t border-gray-200 dark:border-gray-800 flex gap-3 bg-white dark:bg-gray-900"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          placeholder={`Type a message${
            chat.type === "private" ? " (private)" : " (group)"
          }...`}
          className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-full text-sm md:text-base focus:outline-none focus:border-[#00C300] dark:focus:border-[#00E676] focus:bg-white dark:focus:bg-gray-800 transition-colors placeholder-gray-400 dark:placeholder-gray-500"
          autoFocus
        />
        <button
          type="submit"
          disabled={!inputMessage.trim()}
          className={`px-6 md:px-8 py-3 text-white border-none rounded-full text-sm md:text-base font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#00C300]/50 disabled:cursor-not-allowed disabled:transform-none min-w-[60px] md:min-w-[80px] ${
            inputMessage.trim()
              ? "bg-[#00C300] dark:bg-gray-700"
              : "bg-gray-400 dark:bg-gray-600"
          }`}
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default ChatRoom;

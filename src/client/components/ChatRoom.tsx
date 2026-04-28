import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router";
import { usePartySocket } from "partysocket/react";
import { Hash, Send, Smile, PlusCircle } from "lucide-react";
import { type SocketMessage } from "../../shared";

export default function ChatRoom() {
  const { room = "general" } = useParams();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

  const socket = usePartySocket({
    room,
    onMessage(evt) {
      const data = JSON.parse(evt.data) as SocketMessage;

      if (data.type === "ready") {
        setMessages(data.history);
      } else if (data.type === "chat_message") {
        setMessages(prev => {
          const idx = prev.findIndex(m => m.tempId === data.tempId);
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = data;
            return next;
          }
          return [...prev, data];
        });
      } else if (data.type === "typing") {
        updateTyping(data.user, data.isTyping);
      }
    }
  });

  const updateTyping = (user: string, isTyping: boolean) => {
    setTypingUsers(prev => {
      const next = new Set(prev);
      if (isTyping) next.add(user);
      else next.delete(user);
      return next;
    });

    if (isTyping) {
      if (typingTimeoutRef.current[user]) clearTimeout(typingTimeoutRef.current[user]);
      typingTimeoutRef.current[user] = setTimeout(() => {
        updateTyping(user, false);
      }, 3000);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const tempId = crypto.randomUUID();
    const payload = {
      type: "chat_message",
      content: input,
      tempId,
      roomId: room
    };

    // Optimistic Update
    setMessages(prev => [...prev, { ...payload, user: "Me", timestamp: new Date().toISOString(), status: "sending" }]);
    socket.send(JSON.stringify(payload));
    setInput("");
    socket.send(JSON.stringify({ type: "typing", isTyping: false, roomId: room }));
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    socket.send(JSON.stringify({ type: "typing", isTyping: true, roomId: room }));
  };

  return (
    <div className="flex flex-col h-full bg-[#313338]">
      <header className="h-12 border-b border-[#1f2124] flex items-center px-4 shadow-sm">
        <Hash className="text-[#80848e] mr-2" size={24} />
        <span className="font-bold text-white">{room}</span>
      </header>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar" ref={scrollRef}>
        <div className="space-y-1">
          {messages.map((msg, i) => (
            <div key={msg.id || msg.tempId} className="flex flex-col group hover:bg-[#2e3035] -mx-4 px-4 py-1">
              {/* Logic to group messages from same user would go here */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-500 mt-1 flex-shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white hover:underline cursor-pointer">{msg.user}</span>
                    <span className="text-[10px] text-[#949ba4]">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <p className={`text-[#dbdee1] leading-snug ${msg.status === 'sending' ? 'opacity-50' : ''}`}>
                    {msg.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer className="px-4 pb-6 pt-2">
        {typingUsers.size > 0 && (
          <div className="text-xs text-white mb-1 pl-12 animate-pulse">
            <span className="font-bold">{Array.from(typingUsers).join(", ")}</span> is typing...
          </div>
        )}
        <form onSubmit={handleSend} className="bg-[#383a40] rounded-lg flex items-center px-4 py-1 gap-3">
          <PlusCircle className="text-[#b5bac1] cursor-pointer hover:text-white" />
          <input
            value={input}
            onChange={onInputChange}
            className="flex-1 bg-transparent py-2 text-[#dbdee1] focus:outline-none"
            placeholder={`Message #${room}`}
          />
          <div className="flex gap-3 text-[#b5bac1]">
            <Smile className="cursor-pointer hover:text-white" />
            <button type="submit"><Send className="cursor-pointer hover:text-white" size={20} /></button>
          </div>
        </form>
      </footer>
    </div>
  );
}

import React, { useState, useEffect, useRef } from "react";
import { usePartySocket } from "partysocket/react";
import { MessageSquare, Hash, User, Settings, Shield } from "lucide-react";

export default function App() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const socket = usePartySocket({
    host: window.location.host,
    room: "general",
    onMessage(evt) {
      const msg = JSON.parse(evt.data);
      if (msg.type === "add") {
        setMessages(prev => {
          // Resolve optimistic message
          const existing = prev.findIndex(m => m.tempId === msg.tempId);
          if (existing !== -1) {
            const next = [...prev];
            next[existing] = msg;
            return next;
          }
          return [...prev, msg];
        });
      }
    }
  });

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input) return;

    const tempId = crypto.randomUUID();
    const optimisticMsg = { tempId, content: input, user: "Me", status: "sending" };
    
    setMessages(prev => [...prev, optimisticMsg]);
    socket.send(JSON.stringify({ type: "add", content: input, roomId: "general", tempId }));
    setInput("");
  };

  return (
    <div className="flex h-screen bg-[#313338] text-[#dbdee1] font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 bg-[#2b2d31] flex flex-col hidden md:flex">
        <div className="h-12 shadow-md flex items-center px-4 font-bold border-b border-[#1f2124]">
          Durable Chat Pro
        </div>
        <div className="flex-1 p-2 space-y-1">
          <button className="w-full flex items-center gap-2 p-2 rounded bg-[#3f4147] text-white">
            <Hash size={20} /> general
          </button>
          <button className="w-full flex items-center gap-2 p-2 rounded hover:bg-[#35373c]">
            <Hash size={20} /> announcement
          </button>
        </div>
        {/* Profile Area */}
        <div className="bg-[#232428] p-2 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-500" />
          <div className="flex-1 text-sm font-semibold">User#1234</div>
          <Settings size={18} className="cursor-pointer" />
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <header className="h-12 flex items-center px-4 shadow-sm border-b border-[#1f2124]">
          <Hash size={24} className="text-[#80848e] mr-2" />
          <span className="font-bold text-white">general</span>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={m.id || m.tempId} className="flex gap-4 group hover:bg-[#2e3035] -mx-4 px-4 py-1">
              <div className="w-10 h-10 rounded-full bg-gray-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white hover:underline cursor-pointer">{m.user}</span>
                  <span className="text-xs text-[#949ba4]">{new Date().toLocaleTimeString()}</span>
                </div>
                <p className={`${m.status === 'sending' ? 'opacity-50' : ''}`}>{m.content}</p>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={send} className="p-4">
          <div className="bg-[#383a40] rounded-lg flex items-center px-4 py-1">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              className="flex-1 bg-transparent py-2 focus:outline-none"
              placeholder="Message #general"
            />
          </div>
        </form>
      </div>
    </div>
  );
}

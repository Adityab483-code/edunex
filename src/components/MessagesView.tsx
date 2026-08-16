import React, { useState, useEffect, useRef } from "react";
import { Message, Role, User } from "../types";
import { UserAvatar } from "./UserAvatar";
import { 
  Send, 
  Search, 
  User as UserIcon, 
  MessageSquare, 
  Check, 
  CheckCheck,
  Circle,
  Radio,
  Volume2,
  VolumeX,
  Sparkles,
  RefreshCw,
  Clock,
  ShieldCheck,
  GraduationCap,
  Users,
  Smile,
  Paperclip,
  Zap
} from "lucide-react";
import { realtimeClient, playMessageChime, RealtimeStatus } from "../lib/realtime";

interface Contact {
  id: string;
  name: string;
  role: "TEACHER" | "STUDENT" | "ADMIN";
  avatar: string;
  status: "online" | "offline" | "away";
  title?: string;
  lastSeen?: string;
}

interface MessagesViewProps {
  messages: Message[];
  currentUser: User;
  users?: User[];
  onSendMessage: (senderId: string, receiverId: string, content: string) => void;
}

export const MessagesView: React.FC<MessagesViewProps> = ({
  messages,
  currentUser,
  users = [],
  onSendMessage
}) => {
  // Support channel constant
  const supportContact: Contact = {
    id: "usr-support",
    name: "EduNex Helpdesk & AI Support",
    role: "ADMIN",
    title: "24/7 Academic & Platform Support",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    status: "online"
  };

  const [presenceMap, setPresenceMap] = useState<Record<string, "online" | "offline" | "away">>({});

  // Dynamically build contacts from registered users (excluding current user) + support
  const registeredContacts: Contact[] = users
    .filter(u => u.id !== currentUser.id)
    .map(u => ({
      id: u.id,
      name: u.name,
      role: u.role as "TEACHER" | "STUDENT" | "ADMIN",
      title: u.bio || `${u.role} - ${u.department || "Academic Member"}`,
      avatar: u.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120",
      status: presenceMap[u.id] || "online"
    }));

  const contacts: Contact[] = [
    { ...supportContact, status: presenceMap["usr-support"] || "online" },
    ...registeredContacts
  ];

  const [activeContactId, setActiveContactId] = useState<string>(contacts[0]?.id || "usr-support");
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<"ALL" | "TEACHER" | "STUDENT" | "ADMIN">("ALL");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>("connected");
  const [typingMap, setTypingMap] = useState<Record<string, boolean>>({});
  const [isTypingSelf, setIsTypingSelf] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  const activeContact = contacts.find(c => c.id === activeContactId) || contacts[0] || supportContact;

  // Initialize Real-time client listeners
  useEffect(() => {
    realtimeClient.connect(currentUser.id, currentUser.name, currentUser.role);
    setRealtimeStatus(realtimeClient.getStatus());

    const unsubStatus = realtimeClient.onStatusChange((status) => {
      setRealtimeStatus(status);
    });

    const unsubTyping = realtimeClient.onTyping((event) => {
      if (event.receiverId === currentUser.id) {
        setTypingMap(prev => ({
          ...prev,
          [event.senderId]: event.isTyping
        }));
      }
    });

    const unsubPresence = realtimeClient.onPresence((presence) => {
      setPresenceMap(prev => ({
        ...prev,
        [presence.userId]: presence.status
      }));
    });

    return () => {
      unsubStatus();
      unsubTyping();
      unsubPresence();
    };
  }, [currentUser.id, currentUser.name, currentUser.role]);

  // Auto-scroll to bottom when messages or typing state change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingMap, activeContactId]);

  // Mark active conversation messages as read
  useEffect(() => {
    if (activeContactId) {
      realtimeClient.markRead(activeContactId, currentUser.id);
    }
  }, [activeContactId, messages, currentUser.id]);

  // Conversation thread for currently active contact with strict deduplication
  const thread = messages
    .filter(
      m => (m.senderId === currentUser.id && (m.receiverId === activeContact.id || (activeContact.id === "all" && m.receiverId === "all"))) ||
           (m.senderId === activeContact.id && (m.receiverId === currentUser.id || m.receiverId === "all"))
    )
    .reduce((acc: Message[], curr) => {
      if (!acc.some(item => item.id === curr.id)) {
        acc.push(curr);
      }
      return acc;
    }, []);

  // Calculate unread counts per contact
  const getUnreadCount = (contactId: string) => {
    return messages.filter(
      m => m.senderId === contactId && m.receiverId === currentUser.id && !m.read
    ).length;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    // Emit live typing indicator
    if (!isTypingSelf) {
      setIsTypingSelf(true);
      realtimeClient.sendTyping(currentUser.id, activeContact.id, currentUser.name, true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTypingSelf(false);
      realtimeClient.sendTyping(currentUser.id, activeContact.id, currentUser.name, false);
    }, 1500);
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = inputText.trim();
    if (!clean) return;

    if (isTypingSelf) {
      setIsTypingSelf(false);
      realtimeClient.sendTyping(currentUser.id, activeContact.id, currentUser.name, false);
    }

    onSendMessage(currentUser.id, activeContact.id, clean);
    setInputText("");

    if (soundEnabled) {
      playMessageChime();
    }
  };

  const handleQuickPrompt = (promptText: string) => {
    setInputText(promptText);
  };

  // Filter contacts by search query & category tab
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (contact.title && contact.title.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = filterRole === "ALL" || contact.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const isContactTyping = Boolean(typingMap[activeContact.id]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden h-[calc(100vh-130px)] flex flex-col md:flex-row transition-colors">
      
      {/* ========================================================= */}
      {/* CONTACTS SIDEBAR */}
      {/* ========================================================= */}
      <div className="w-full md:w-84 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/70 dark:bg-slate-900/60 shrink-0">
        
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight">
                Live Channels
              </h2>
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 animate-pulse">
                <Radio className="w-2.5 h-2.5" /> Live
              </span>
            </div>

            {/* Sound toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title={soundEnabled ? "Mute notification chimes" : "Enable notification chimes"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search faculty, classmates, support..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>

          {/* Filter category pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: "ALL", label: "All" },
              { id: "TEACHER", label: "Faculty" },
              { id: "STUDENT", label: "Peers" },
              { id: "ADMIN", label: "Support" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterRole(tab.id as any)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all ${
                  filterRole === tab.id
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contacts List */}
        <div className="overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800/60">
          {filteredContacts.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs">
              No contacts found matching "{searchQuery}"
            </div>
          ) : (
            filteredContacts.map((contact) => {
              const unread = getUnreadCount(contact.id);
              const isTyping = Boolean(typingMap[contact.id]);
              const isSelected = activeContactId === contact.id;

              return (
                <button
                  key={contact.id}
                  onClick={() => setActiveContactId(contact.id)}
                  className={`w-full p-3.5 flex items-center gap-3 transition-all text-left relative ${
                    isSelected
                      ? "bg-indigo-50/90 dark:bg-indigo-950/40 border-l-4 border-indigo-600 shadow-inner"
                      : "hover:bg-slate-100/80 dark:hover:bg-slate-800/40"
                  }`}
                >
                  <div className="relative shrink-0">
                    <UserAvatar
                      avatar={contact.avatar}
                      name={contact.name}
                      role={contact.role}
                      size="lg"
                    />
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 ${
                        contact.status === "online" 
                          ? "bg-emerald-500 shadow-xs shadow-emerald-500/50" 
                          : "bg-slate-400"
                      }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className={`text-xs font-bold truncate ${
                        isSelected ? "text-indigo-950 dark:text-white" : "text-slate-900 dark:text-slate-100"
                      }`}>
                        {contact.name}
                      </h4>
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        contact.role === "TEACHER" 
                          ? "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300"
                          : contact.role === "ADMIN"
                          ? "bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                          : "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                      }`}>
                        {contact.role}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      {isTyping ? (
                        <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 animate-pulse">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-ping" />
                          typing...
                        </span>
                      ) : (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {contact.title || "Click to message..."}
                        </p>
                      )}

                      {unread > 0 && (
                        <span className="shrink-0 px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-extrabold shadow-sm animate-bounce">
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Sidebar Live Status Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${
              realtimeStatus === "connected" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
            }`} />
            <span className="text-slate-600 dark:text-slate-300 font-medium">
              {realtimeStatus === "connected" ? "WebSocket Active" : "Connecting..."}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Port 3000 Sync</span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MAIN CONVERSATION WINDOW */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900 min-w-0">
        
        {/* Active Contact Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <UserAvatar
                avatar={activeContact.avatar}
                name={activeContact.name}
                role={activeContact.role}
                size="md"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {activeContact.name}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                  {activeContact.role}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {activeContact.title || "EduNex Community Member"} • Real-Time Channel
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Live Mode On</span>
            </div>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50 dark:bg-slate-950/40">
          {thread.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-14 h-14 rounded-3xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-100 dark:border-indigo-900">
                <MessageSquare className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Direct Live Channel with {activeContact.name}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                  Send a message to receive instantaneous academic assistance, assignment guidance, or team updates.
                </p>
              </div>
            </div>
          ) : (
            thread.map((msg) => {
              const isMe = msg.senderId === currentUser.id;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? "items-end" : "items-start"} animate-in fade-in slide-in-from-bottom-1 duration-200`}
                >
                  <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[75%]">
                    {!isMe && (
                      <UserAvatar
                        avatar={activeContact.avatar}
                        name={activeContact.name}
                        role={activeContact.role}
                        size="xs"
                        className="mb-1"
                      />
                    )}

                    <div
                      className={`p-3.5 rounded-2xl text-xs space-y-1.5 shadow-xs ${
                        isMe
                          ? "bg-indigo-600 text-white rounded-br-xs shadow-indigo-500/10"
                          : "bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-xs border border-slate-200/90 dark:border-slate-700/80 shadow-xs"
                      }`}
                    >
                      <p className="leading-relaxed whitespace-pre-wrap select-text">
                        {msg.content}
                      </p>
                      
                      <div className={`flex items-center justify-end gap-1 text-[9px] ${
                        isMe ? "text-indigo-200" : "text-slate-400 dark:text-slate-500"
                      }`}>
                        <span>{msg.timestamp || "Just now"}</span>
                        {isMe && <CheckCheck className="w-3.5 h-3.5 text-indigo-200" />}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Typing Indicator in Stream */}
          {isContactTyping && (
            <div className="flex items-center gap-2 animate-in fade-in duration-200">
              <UserAvatar
                avatar={activeContact.avatar}
                name={activeContact.name}
                role={activeContact.role}
                size="xs"
              />
              <div className="px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2 shadow-xs">
                <span className="font-semibold">{activeContact.name} is typing</span>
                <div className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-bounce" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 pt-2 pb-1 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/60 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 shrink-0">
            <Sparkles className="w-3 h-3 text-amber-500" /> Quick Prompts:
          </span>
          {[
            "Review my assignment submission",
            "Are office hours open today?",
            "How do I optimize the database query?",
            "Milestone 2 integration is complete!"
          ].map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickPrompt(prompt)}
              className="text-[10px] px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 whitespace-nowrap transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat Input Form */}
        <form onSubmit={handleSend} className="p-3 sm:p-4 bg-white dark:bg-slate-900 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            placeholder={`Message ${activeContact.name} live...`}
            className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white transition-all shadow-md shadow-indigo-500/20 shrink-0 flex items-center justify-center"
            title="Send live message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

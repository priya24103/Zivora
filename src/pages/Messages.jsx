import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { 
  MessageSquare, 
  Send, 
  Search, 
  User as UserIcon, 
  Clock, 
  ShieldCheck, 
  ArrowLeft,
  Sparkles,
  CheckCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const API_BASE = 'http://localhost:2409/api';
const SOCKET_URL = 'http://localhost:2409';

export default function Messages() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('zivora_user'));
    } catch {
      return null;
    }
  });

  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [socket, setSocket] = useState(null);
  const chatContainerRef = useRef(null);

  // Parse location state / query params if navigating from Product Detail or RFQs
  const targetRecipientId = location.state?.recipientId || new URLSearchParams(location.search).get('recipientId');
  const targetRecipientName = location.state?.recipientName || new URLSearchParams(location.search).get('recipientName');
  const initialText = location.state?.initialText || '';

  const token = localStorage.getItem('zivora_token');

  // Initialize Socket.io connection
  useEffect(() => {
    const socketIo = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    });
    setSocket(socketIo);

    socketIo.on('connect', () => {
      console.log('Connected to Zivora Messaging socket:', socketIo.id);
    });

    return () => {
      socketIo.disconnect();
    };
  }, []);

  // Listen for incoming socket messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msgData) => {
      if (selectedConv && (msgData.conversationId === selectedConv._id || msgData.senderId === getOtherParticipant(selectedConv)?._id)) {
        setMessages(prev => {
          if (prev.some(m => m._id === msgData._id)) return prev;
          return [...prev, {
            _id: msgData._id || Date.now().toString(),
            senderId: msgData.senderId,
            text: msgData.text,
            createdAt: msgData.createdAt || new Date().toISOString()
          }];
        });
        markAsRead(selectedConv._id);
      }

      fetchConversations();
    };

    socket.on('message', handleNewMessage);
    return () => {
      socket.off('message', handleNewMessage);
    };
  }, [socket, selectedConv]);

  // Fetch user conversations
  const fetchConversations = async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${API_BASE}/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.status === 'success') {
        const convList = response.data.data.conversations || [];
        setConversations(convList);

        if (targetRecipientId) {
          const existing = convList.find(c => 
            c.participants?.some(p => (p._id || p) === targetRecipientId)
          );
          if (existing) {
            setSelectedConv(existing);
            setMessages(existing.messages || []);
          } else if (targetRecipientName) {
            const tempConv = {
              _id: 'temp_' + targetRecipientId,
              isTemp: true,
              participants: [
                user,
                { _id: targetRecipientId, name: targetRecipientName, email: '', role: 'seller' }
              ],
              messages: []
            };
            setSelectedConv(tempConv);
            setMessages([]);
          }
        } else if (convList.length > 0 && !selectedConv) {
          setSelectedConv(convList[0]);
          setMessages(convList[0].messages || []);
          markAsRead(convList[0]._id);
        }
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchConversations();
  }, [token]);

  const handleSelectConv = (conv) => {
    setSelectedConv(conv);
    setMessages(conv.messages || []);
    if (!conv.isTemp) {
      markAsRead(conv._id);
    }
  };

  const markAsRead = async (convId) => {
    if (!token || !convId || String(convId).startsWith('temp_')) return;
    try {
      await axios.patch(`${API_BASE}/conversations/${convId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(prev => prev.map(c => c._id === convId ? { ...c, unread: false } : c));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (initialText && !text) {
      setText(initialText);
    }
  }, [initialText]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || !selectedConv) return;

    const otherUser = getOtherParticipant(selectedConv);
    if (!otherUser?._id) return;

    const messageText = text.trim();
    setText('');

    const optimisticMsg = {
      _id: 'opt_' + Date.now(),
      senderId: user?._id || user?.id,
      text: messageText,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const response = await axios.post(`${API_BASE}/conversations/send`, {
        recipientId: otherUser._id,
        text: messageText
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.status === 'success') {
        const updatedConv = response.data.data.conversation;
        setMessages(updatedConv.messages || []);
        
        setConversations(prev => {
          const exists = prev.some(c => c._id === updatedConv._id);
          if (exists) {
            return prev.map(c => c._id === updatedConv._id ? updatedConv : c);
          }
          return [updatedConv, ...prev];
        });
        setSelectedConv(updatedConv);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message. Please try again.');
    }
  };

  const getOtherParticipant = (conv) => {
    if (!conv || !conv.participants) return null;
    const currentUserId = user?._id || user?.id;
    return conv.participants.find(p => (p._id || p) !== currentUserId) || conv.participants[0];
  };

  const filteredConversations = conversations.filter(conv => {
    const other = getOtherParticipant(conv);
    return other?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           other?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           conv.lastMsg?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="w-full min-h-[calc(100vh-140px)] bg-[#F7F3EF] px-4 md:px-8 py-6 flex flex-col font-sans">
      <div className="max-w-7xl w-full mx-auto mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate(-1)} 
              className="p-1.5 rounded-full hover:bg-[#EBE3DB] text-[#3A2D28] transition-colors md:hidden"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl md:text-3xl font-serif text-[#3A2D28] flex items-center gap-2.5">
              Messages <Sparkles className="w-5 h-5 text-[#CBAD8D]" />
            </h1>
          </div>
          <p className="text-xs text-[#A48374] mt-1">
            Direct communication for diamond inquiries, RFQs, and order details
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EBE3DB] border border-[#CBAD8D]/20 text-[11px] text-[#3A2D28]">
          <ShieldCheck className="w-4 h-4 text-[#A48374]" />
          <span>Encrypted Platform Messaging</span>
        </div>
      </div>

      <div className="max-w-7xl w-full mx-auto flex-1 bg-white rounded-3xl border border-[#CBAD8D]/20 shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        <div className="w-full md:w-80 lg:w-96 bg-[#FBF9F6] border-r border-[#CBAD8D]/15 flex flex-col">
          <div className="p-4 border-b border-[#CBAD8D]/15">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#A48374]" />
              <input 
                type="text" 
                placeholder="Search messages or users..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#F1EDE6] text-xs text-[#3A2D28] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#A48374] placeholder-[#A48374]/70"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-xs text-[#A48374]">Loading conversations...</div>
            ) : filteredConversations.length === 0 && !selectedConv?.isTemp ? (
              <div className="p-8 text-center flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-[#F1EDE6] flex items-center justify-center text-[#A48374] mb-3">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-[#3A2D28]">No messages yet</p>
                <p className="text-[11px] text-[#A48374] mt-1">
                  Start an inquiry from product pages or RFQs to initiate a conversation.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#CBAD8D]/10">
                {selectedConv?.isTemp && (
                  <div 
                    onClick={() => handleSelectConv(selectedConv)}
                    className="p-4 bg-[#F1EDE6] cursor-pointer border-l-4 border-[#3A2D28]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#3A2D28] text-white font-semibold flex items-center justify-center text-xs">
                        {getOtherParticipant(selectedConv)?.name?.[0] || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#3A2D28] truncate">
                          {getOtherParticipant(selectedConv)?.name}
                        </p>
                        <p className="text-[11px] text-[#A48374] italic">New conversation draft...</p>
                      </div>
                    </div>
                  </div>
                )}

                {filteredConversations.map((conv) => {
                  const other = getOtherParticipant(conv);
                  const isSelected = selectedConv?._id === conv._id;
                  const hasUnread = conv.unread;

                  return (
                    <div 
                      key={conv._id} 
                      onClick={() => handleSelectConv(conv)}
                      className={`p-4 cursor-pointer transition-colors relative hover:bg-[#F1EDE6]/60 ${
                        isSelected ? 'bg-[#F1EDE6] border-l-4 border-[#3A2D28]' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold uppercase shadow-sm flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, #3A2D28, #A48374)' }}
                        >
                          {other?.name ? other.name[0] : 'U'}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-semibold text-[#3A2D28] truncate">
                              {other?.name || 'Zivora User'}
                            </h4>
                            {conv.lastMessage?.timestamp && (
                              <span className="text-[10px] text-[#A48374]">
                                {new Date(conv.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-1">
                            <p className={`text-[11px] truncate ${hasUnread ? 'font-bold text-[#3A2D28]' : 'text-[#A48374]'}`}>
                              {conv.lastMsg || 'No messages yet'}
                            </p>
                            {hasUnread && (
                              <span className="w-2 h-2 rounded-full bg-[#A48374] flex-shrink-0 ml-2 animate-pulse" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-white">
          {selectedConv ? (
            <>
              <div className="px-6 py-4 border-b border-[#CBAD8D]/15 flex items-center justify-between bg-[#FBF9F6]">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold uppercase shadow-sm"
                    style={{ background: 'linear-gradient(135deg, #3A2D28, #A48374)' }}
                  >
                    {getOtherParticipant(selectedConv)?.name?.[0] || 'U'}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#3A2D28]">
                      {getOtherParticipant(selectedConv)?.name}
                    </h3>
                    <p className="text-[10px] text-[#A48374] uppercase tracking-wider">
                      Role: {getOtherParticipant(selectedConv)?.role || 'Member'} • Verified Partner
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EBE3DB] text-[10px] font-semibold text-[#3A2D28]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Live Socket Connected
                  </span>
                </div>
              </div>

              <div ref={chatContainerRef} className="flex-1 p-6 overflow-y-auto space-y-4 bg-[#FBF9F6]/30 h-[460px] max-h-[460px]">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <Sparkles className="w-8 h-8 text-[#CBAD8D] mb-2 animate-bounce" />
                    <p className="text-xs font-semibold text-[#3A2D28]">Start the Conversation</p>
                    <p className="text-[11px] text-[#A48374] max-w-xs mt-1">
                      Send a message below to inquire about diamonds, pricing, certification, or order specs.
                    </p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = (msg.senderId?._id || msg.senderId) === (user?._id || user?.id);
                    return (
                      <motion.div 
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={msg._id || idx} 
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div 
                          className={`max-w-[75%] px-4 py-3 rounded-2xl text-xs shadow-sm leading-relaxed ${
                            isMe 
                              ? 'bg-[#3A2D28] text-[#F1EDE6] rounded-br-none' 
                              : 'bg-[#F1EDE6] text-[#3A2D28] border border-[#CBAD8D]/20 rounded-bl-none'
                          }`}
                        >
                          {msg.text}
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-[9px] text-[#A48374]">
                          <span>
                            {msg.createdAt 
                              ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                              : 'Just now'}
                          </span>
                          {isMe && <CheckCheck className="w-3 h-3 text-[#A48374]" />}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              <form onSubmit={handleSendMessage} className="p-4 border-t border-[#CBAD8D]/15 bg-white flex items-center gap-3">
                <input 
                  type="text" 
                  placeholder="Write your message..." 
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-2xl bg-[#F7F3EF] border border-[#CBAD8D]/20 text-xs text-[#3A2D28] focus:outline-none focus:ring-1 focus:ring-[#A48374]"
                />
                <button 
                  type="submit"
                  disabled={!text.trim()}
                  className="w-11 h-11 rounded-2xl bg-[#3A2D28] text-white flex items-center justify-center hover:bg-[#A48374] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-md cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-[#F7F3EF] flex items-center justify-center text-[#A48374] mb-4">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-base font-serif text-[#3A2D28]">Select a Conversation</h3>
              <p className="text-xs text-[#A48374] max-w-sm mt-1">
                Choose a conversation from the sidebar to view message history and reply in real time.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

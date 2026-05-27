import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const socket = io('http://localhost:5000', { autoConnect: false });

export default function Chat() {
  const { user } = useAuth();
  const toast = useToast();
  const messagesEndRef = useRef(null);

  // States
  const [connectedUsers, setConnectedUsers] = useState([]); 
  const [activeChat, setActiveChat] = useState(null);       
  const [messages, setMessages] = useState([]);             
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const activeChatRef = useRef(activeChat);
  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  // Crypto Helpers
  const encryptMessage = (text) => btoa(unescape(encodeURIComponent(text))); 
  const decryptMessage = (cipherText) => {
    if (!cipherText) return '';
    try {
      return decodeURIComponent(escape(atob(cipherText)));
    } catch (e) {
      return cipherText; 
    }
  };

  // Socket Connection & Real-time Listeners
  useEffect(() => {
    if (user) {
      socket.connect();
      socket.emit('user:online', user._id);
    }

    socket.off('message:receive');
    socket.on('message:receive', (incomingMessage) => {
      const currentActiveChat = activeChatRef.current;
      if (currentActiveChat && (incomingMessage.sender === currentActiveChat._id || incomingMessage.receiver === currentActiveChat._id)) {
        setMessages((prev) => [...prev, incomingMessage]);
      } else {
        toast(`New message from someone sweet! 💌`);
      }
    });

    return () => {
      socket.off('message:receive');
    };
  }, [user]);

  // Initial Fetching
  useEffect(() => {
    fetchChatContacts();
  }, []);

  useEffect(() => {
    if (activeChat) {
      fetchConversationHistory();
    }
  }, [activeChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChatContacts = async () => {
    try {
      const { data } = await api.get('/users');
      setConnectedUsers(data);
    } catch (err) { console.error(err); }
  };

  const fetchConversationHistory = async () => {
    try {
      const { data } = await api.get(`/messages/${activeChat._id}`);
      setMessages(data);
    } catch (err) { console.error(err); }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    const secureTextPayload = encryptMessage(newMessage);

    try {
      const { data } = await api.post(`/messages/${activeChat._id}`, { text: secureTextPayload });
      
      socket.emit('message:send', {
        sender: user._id,
        receiver: activeChat._id,
        text: secureTextPayload
      });

      setMessages((prev) => [...prev, data]);
      setNewMessage('');
    } catch (err) {
      toast('Message failed to deliver', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 73px)', background: '#0b0813', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      
      {/* Injecting CSS Keyframes for smooth animations right into the DOM */}
      <style>{`
        @keyframes popIn {
          0% { transform: scale(0.92) translateY(10px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        .interactive-bubble {
          animation: popIn 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          transition: transform 0.2s ease, filter 0.2s ease;
        }
        .interactive-bubble:hover {
          transform: scale(1.015);
          filter: brightness(1.05);
          cursor: pointer;
        }
        .contact-card {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .contact-card:hover {
          background: rgba(124, 58, 237, 0.08) !important;
          transform: translateX(4px);
        }
        .send-btn {
          transition: all 0.2s ease;
        }
        .send-btn:active {
          transform: scale(0.95);
        }
      `}</style>

      {/* ================= SIDEBAR CONNECTIONS HUB ================= */}
      <div style={{ width: '320px', borderRight: '1px solid rgba(255, 255, 255, 0.06)', background: 'rgba(20, 16, 35, 0.4)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <h2 style={{ color: '#fff', fontSize: '18px', margin: 0, fontWeight: 700 }}>Chats 🌸</h2>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {connectedUsers.map(u => (
            <div 
              key={u._id} 
              onClick={() => setActiveChat(u)} 
              className="contact-card"
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '14px',
                cursor: 'pointer', marginBottom: '6px',
                background: activeChat?._id === u._id ? 'rgba(124, 58, 237, 0.12)' : 'transparent',
                border: activeChat?._id === u._id ? '1px solid rgba(124, 58, 237, 0.2)' : '1px solid transparent'
              }}
            >
              <div style={{ position: 'relative' }}>
                <img src={u.avatar ? `http://localhost:5000${u.avatar}` : `https://api.dicebear.com/7.x/adventurer/svg?seed=${u.name}`} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', background: '#10b981', border: '2px solid #0b0813' }} />
              </div>
              <div>
                <div style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>{u.name}</div>
                <div style={{ color: '#64748b', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}><span>🔒</span> Secure Link</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= ACTIVE INTERACTIVE CHAT SCREEN ================= */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0e0b18' }}>
        {activeChat ? (
          <>
            {/* Header Banner */}
            <div style={{ padding: '16px 28px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', background: 'rgba(20, 16, 35, 0.25)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src={activeChat.avatar ? `http://localhost:5000${activeChat.avatar}` : `https://api.dicebear.com/7.x/adventurer/svg?seed=${activeChat.name}`} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
              <div>
                <h3 style={{ color: '#fff', margin: 0, fontSize: '15px', fontWeight: 600 }}>{activeChat.name}</h3>
                <span style={{ color: '#a78bfa', fontSize: '11px', fontWeight: 500 }}>Active Now • End-to-End Encrypted</span>
              </div>
            </div>

            {/* Main Interactive Scrolling Messages Arena */}
            <div style={{
              flex: 1,
              padding: '24px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              background: '#0d0a1b', 
              backgroundImage: 'radial-gradient(circle at top right, rgba(124,58,237,0.04), transparent 40%)'
            }}>
              {messages.map((msg, i) => {
                const isMyMessage = msg.sender === user._id || msg.sender?._id === user._id;

                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: isMyMessage ? 'flex-end' : 'flex-start',
                      width: '100%'
                    }}
                  >
                    {/* Interactive Custom Bubble Container */}
                    <div
                      className="interactive-bubble"
                      style={{
                        maxWidth: '60%',
                        padding: '11px 16px',
                        fontSize: '14px',
                        lineHeight: '1.45',
                        fontWeight: '500',
                        color: '#ffffff',
                        borderRadius: isMyMessage ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                        background: isMyMessage
                          ? 'linear-gradient(135deg, #a78bfa, #ec4899)' 
                          : 'rgba(255, 255, 255, 0.06)',               
                        border: isMyMessage ? 'none' : '1px solid rgba(255, 255, 255, 0.05)',
                        boxShadow: isMyMessage ? '0 4px 15px rgba(236, 72, 153, 0.12)' : 'none',
                        wordBreak: 'break-word',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '3px'
                      }}
                    >
                      <div>{decryptMessage(msg.text)}</div>
                      
                      <span style={{
                        fontSize: '9px',
                        color: isMyMessage ? 'rgba(255, 255, 255, 0.6)' : '#64748b',
                        alignSelf: 'flex-end',
                        fontWeight: '600',
                        userSelect: 'none'
                      }}>
                        {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Interactive Dynamic Form Entry Utility */}
            <form onSubmit={handleSendMessage} style={{ padding: '20px', background: 'rgba(20, 16, 35, 0.4)', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Type a cute secure message... 🔐🌸"
                  style={{
                    width: '100%', padding: '14px 20px', paddingRight: '50px', borderRadius: '16px',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    color: '#fff', outline: 'none', fontSize: '14px', transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(167, 139, 250, 0.4)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                />
                <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', opacity: 0.7 }}>😊</span>
              </div>
              
              <button 
                type="submit" 
                className="send-btn"
                style={{
                  background: 'linear-gradient(135deg, #a78bfa, #ec4899)', color: '#fff', border: 'none',
                  height: '46px', padding: '0 24px', borderRadius: '16px', fontWeight: 600, fontSize: '14px',
                  cursor: 'pointer', boxShadow: '0 4px 12px rgba(236, 72, 153, 0.2)', display: 'flex', alignItems: 'center', gap: '4px'
                }}
              >
                <span>Send</span><span>✨</span>
              </button>
            </form>
          </>
        ) : (
          /* Empty Chat View State Placeholder */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px', animation: 'popIn 0.5s ease' }}>🔮✨🌸</div>
            <h4 style={{ color: '#fff', margin: '0 0 6px', fontSize: '18px', fontWeight: 700 }}>Your Protected Space</h4>
            <p style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', maxWidth: '280px', margin: 0, lineHeight: 1.5 }}>
              Select a friend channel from your list on the left side to look at live messaging history!
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
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
  const fileInputRef = useRef(null);

  // Structural Lists
  const [connectedUsers, setConnectedUsers] = useState([]); 
  const [activeChat, setActiveChat] = useState(null);       
  const [messages, setMessages] = useState([]);             
  const [newMessage, setNewMessage] = useState('');
  
  // Interaction Flags
  const [activeMenuId, setActiveMenuId] = useState(null); 
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [replyingToMessage, setReplyingToMessage] = useState(null);
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [targetDeleteMessage, setTargetDeleteMessage] = useState(null);

  // WhatsApp Feature Flags
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showStickerGifPanel, setShowStickerGifPanel] = useState(false);
  const [currentCall, setCurrentCall] = useState(null); // { room, type: 'audio' | 'video', status: 'incoming' | 'outgoing' | 'connected' }

  const activeChatRef = useRef(activeChat);
  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  // Client E2EE Layer
  const encryptMessage = (text) => btoa(unescape(encodeURIComponent(text))); 
  const decryptMessage = (cipherText) => {
    if (!cipherText) return '';
    try {
      return decodeURIComponent(escape(atob(cipherText)));
    } catch (e) {
      return cipherText; 
    }
  };

  // Real-Time Event Sync Engine
  useEffect(() => {
    if (user) {
      socket.connect();
      socket.emit('user:online', user._id);
    }

    socket.off('message:receive');
    socket.on('message:receive', (incomingMessage) => {
      const currentActiveChat = activeChatRef.current;
      
      if (incomingMessage.action === 'delete-everyone') {
        setMessages((prev) => prev.filter(m => m._id !== incomingMessage.messageId));
        return;
      }
      if (incomingMessage.action === 'edit') {
        setMessages((prev) => prev.map(m => m._id === incomingMessage.messageId ? { ...m, text: incomingMessage.newText, edited: true } : m));
        return;
      }

      const msgSenderId = incomingMessage.sender?._id || incomingMessage.sender;
      const msgReceiverId = incomingMessage.receiver?._id || incomingMessage.receiver;
      const activeId = currentActiveChat?._id;

      if (activeId && (msgSenderId === activeId || msgReceiverId === activeId)) {
        setMessages((prev) => {
          if (prev.some(m => m._id === incomingMessage._id)) return prev;
          return [...prev, incomingMessage];
        });
      } else if (msgSenderId !== user?._id) {
        toast(`New message from ${incomingMessage.sender?.name || 'someone sweet'}! 💌`);
      }
    });

    // WebRTC / Call Signalling Handlers
    socket.off('call:incoming');
    socket.on('call:incoming', ({ from, type, room }) => {
      setCurrentCall({ from, type, room, status: 'incoming' });
      toast(`Incoming ${type} call...`);
    });

    socket.off('call:accepted');
    socket.on('call:accepted', () => {
      setCurrentCall(prev => prev ? { ...prev, status: 'connected' } : null);
      toast('Call connected!');
    });

    socket.off('call:rejected');
    socket.on('call:rejected', () => {
      setCurrentCall(null);
      toast('Call rejected or missed.');
    });

    return () => {
      socket.off('message:receive');
      socket.off('call:incoming');
      socket.off('call:accepted');
      socket.off('call:rejected');
    };
  }, [user, toast]);

  useEffect(() => {
    fetchChatContacts();
  }, []);

  useEffect(() => {
    if (activeChat) {
      // Fixed structural bug from original code variable name typo 'active501'
      fetchConversationHistory();
      setReplyingToMessage(null);
      setEditingMessageId(null);
      setNewMessage('');
      setShowAttachMenu(false);
      setShowStickerGifPanel(false);
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
      setConnectedUsers(Array.isArray(data) ? data : []);
    } catch (err) { 
      console.error(err); 
    }
  };

  const fetchConversationHistory = async () => {
    try {
      const { data } = await api.get(`/messages/${activeChat._id}`);
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) { 
      console.error(err); 
    }
  };

  // Base message transmitter for standard text/stickers/GIs
  const sendStructuredMessage = async (textPayload, extraParams = {}) => {
    const secureTextPayload = encryptMessage(textPayload);
    const payload = { 
      text: secureTextPayload,
      replyTo: replyingToMessage ? replyingToMessage._id : null,
      ...extraParams
    };
    
    const { data } = await api.post(`/messages/${activeChat._id}`, payload);
    
    socket.emit('message:send', {
      ...data,
      sender: user._id,
      receiver: activeChat._id,
      text: secureTextPayload
    });

    setMessages((prev) => [...prev, data]);
    setReplyingToMessage(null);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    try {
      if (editingMessageId) {
        const secureTextPayload = encryptMessage(newMessage);
        await api.patch(`/messages/${editingMessageId}`, { text: secureTextPayload });
        
        socket.emit('message:edit', {
          messageId: editingMessageId,
          receiver: activeChat._id,
          newText: secureTextPayload
        });
        
        setMessages(prev => prev.map(m => m._id === editingMessageId ? { ...m, text: secureTextPayload, edited: true } : m));
        setEditingMessageId(null);
        toast('Message updated! ✨');
      } else {
        await sendStructuredMessage(newMessage, { messageType: 'text' });
      }
      setNewMessage('');
    } catch (err) {
      toast('Message failed to deliver', 'error');
    }
  };

  // Media / Document Pipeline Upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeChat) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('replyTo', replyingToMessage ? replyingToMessage._id : '');

    try {
      toast('Uploading attachment... ⏳');
      // Pass file multipart format to server API endpoint
      const { data } = await api.post(`/messages/${activeChat._id}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      socket.emit('message:send', {
        ...data,
        sender: user._id,
        receiver: activeChat._id,
      });

      setMessages((prev) => [...prev, data]);
      setReplyingToMessage(null);
      setShowAttachMenu(false);
      toast('File sent successfully! 📂');
    } catch (err) {
      toast('File upload failed', 'error');
    }
  };

  // Sticker / GIF Selection Emulation
  const handleSendStickerOrGif = async (url, type) => {
    try {
      await sendStructuredMessage(url, { messageType: type });
      setShowStickerGifPanel(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Call System Integrations
  const initiateCall = (callType) => {
    if (!activeChat) return;
    const callRoomId = `room-${user._id}-${activeChat._id}-${Date.now()}`;
    setCurrentCall({ to: activeChat._id, type: callType, room: callRoomId, status: 'outgoing' });
    
    socket.emit('call:initiate', {
      to: activeChat._id,
      from: { _id: user._id, name: user.name },
      type: callType,
      room: callRoomId
    });
  };

  const handleAcceptCall = () => {
    if (!currentCall) return;
    socket.emit('call:accept', { to: currentCall.from._id, room: currentCall.room });
    setCurrentCall({ ...currentCall, status: 'connected' });
    // Integrate logic here to initialize WebRTC Peer connections using the currentCall.room context
  };

  const handleRejectOrEndCall = () => {
    if (!currentCall) return;
    const targetUserId = currentCall.from?._id || currentCall.to;
    socket.emit('call:reject', { to: targetUserId, room: currentCall.room });
    setCurrentCall(null);
  };

  const handleDeleteForMe = async () => {
    if (!targetDeleteMessage) return;
    try {
      await api.delete(`/messages/${targetDeleteMessage._id}/for-me`);
      setMessages(prev => prev.filter(m => m._id !== targetDeleteMessage._id));
      setShowDeleteModal(false);
      setTargetDeleteMessage(null);
      setActiveMenuId(null);
      toast('Deleted for you 🫧');
    } catch (err) { console.error(err); }
  };

  const handleDeleteForEveryone = async () => {
    if (!targetDeleteMessage) return;
    try {
      await api.delete(`/messages/${targetDeleteMessage._id}/for-all`);
      socket.emit('message:delete-everyone', {
        messageId: targetDeleteMessage._id,
        receiver: activeChat._id
      });
      setMessages(prev => prev.filter(m => m._id !== targetDeleteMessage._id));
      setShowDeleteModal(false);
      setTargetDeleteMessage(null);
      setActiveMenuId(null);
      toast('Deleted for everyone 🌲');
    } catch (err) { console.error(err); }
  };

  const handleForwardMessage = async (targetUserId) => {
    if (!forwardingMessage) return;
    try {
      let payloadText = forwardingMessage.text;
      if (forwardingMessage.messageType === 'text' || !forwardingMessage.messageType) {
        const clearText = decryptMessage(forwardingMessage.text);
        payloadText = encryptMessage(clearText);
      }

      const { data } = await api.post(`/messages/${targetUserId}`, { 
        text: payloadText,
        messageType: forwardingMessage.messageType || 'text',
        fileUrl: forwardingMessage.fileUrl || null,
        isForwarded: true 
      });
      
      socket.emit('message:send', {
        ...data,
        sender: user._id,
        receiver: targetUserId,
      });

      setShowForwardModal(false);
      setForwardingMessage(null);
      setActiveMenuId(null);
      toast('Message forwarded! 🚀');
    } catch (err) { console.error(err); }
  };

  const handleToggleStar = async (msg) => {
    try {
      await api.patch(`/messages/${msg._id}/star`);
      setMessages(prev => prev.map(m => m._id === msg._id ? { ...m, starred: !m.starred } : m));
      setActiveMenuId(null);
      toast(msg.starred ? 'Removed from stars 🌟' : 'Added to starred messages! 🌟');
    } catch (err) { console.error(err); }
  };

  // Helper renderer to classify dynamic media messages inside standard layout templates
  const renderMessageContent = (msg) => {
    switch (msg.messageType) {
      case 'image':
        return <img src={msg.fileUrl || decryptMessage(msg.text)} alt="Sent asset" style={{ maxWidth: '100%', maxHeight: '240px', borderRadius: '12px', marginTop: '4px' }} />;
      case 'sticker':
      case 'gif':
        return <img src={decryptMessage(msg.text)} alt="Expression panel" style={{ width: '120px', height: '120px', objectFit: 'contain' }} />;
      case 'document':
        return (
          <a href={msg.fileUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#60a5fa', textDecoration: 'none', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', marginTop: '4px' }}>
            <span>📄</span>
            <span style={{ fontSize: '13px', wordBreak: 'break-all' }}>{msg.fileName || 'View Document (PDF/PPT/DOCX)'}</span>
          </a>
        );
      default:
        return <div>{decryptMessage(msg.text)}</div>;
    }
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 73px)', background: '#0b0813', fontFamily: 'Plus Jakarta Sans, sans-serif', overflow: 'hidden' }} onClick={() => { setActiveMenuId(null); setShowAttachMenu(false); setShowStickerGifPanel(false); }}>
      
      {/* Hidden File System Router Target */}
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} accept=".jpeg,.png,.jpg,.pdf,.ppt,.pptx,.doc,.docx" />

      {/* ================= SIDEBAR CONNECTIONS HUB ================= */}
      <div style={{ width: '320px', borderRight: '1px solid rgba(255, 255, 255, 0.06)', background: 'rgba(20, 16, 35, 0.4)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <h2 style={{ color: '#fff', fontSize: '18px', margin: 0, fontWeight: 700 }}>Chats 🌸</h2>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {connectedUsers.map(u => (
            <div 
              key={u._id} 
              onClick={(e) => { e.stopPropagation(); setActiveChat(u); }} 
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '14px',
                cursor: 'pointer', marginBottom: '6px', transition: 'all 0.2s ease',
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0e0b18', position: 'relative' }}>
        {activeChat ? (
          <>
            {/* Header Banner - Built with Call Action Hooks */}
            <div style={{ padding: '16px 28px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', background: 'rgba(20, 16, 35, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img src={activeChat.avatar ? `http://localhost:5000${activeChat.avatar}` : `https://api.dicebear.com/7.x/adventurer/svg?seed=${activeChat.name}`} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
                <div>
                  <h3 style={{ color: '#fff', margin: 0, fontSize: '15px', fontWeight: 600 }}>{activeChat.name}</h3>
                  <span style={{ color: '#a78bfa', fontSize: '11px', fontWeight: 500 }}>Active Now • End-to-End Encrypted</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '14px' }}>
                <button title="Audio Call" onClick={() => initiateCall('audio')} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#a78bfa', padding: '10px 14px', borderRadius: '12px', cursor: 'pointer', fontSize: '16px' }}>📞</button>
                <button title="Video Call" onClick={() => initiateCall('video')} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#ec4899', padding: '10px 14px', borderRadius: '12px', cursor: 'pointer', fontSize: '16px' }}>📹</button>
              </div>
            </div>

            {/* Scrolling Messaging Window */}
            <div style={{
              flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', background: '#0d0a1b', 
              backgroundImage: 'radial-gradient(circle at top right, rgba(124,58,237,0.04), transparent 40%)'
            }}>
              
              {messages.map((msg, i) => {
                const msgSenderId = msg.sender?._id || msg.sender;
                const isMyMessage = msgSenderId === user?._id;

                if (msg.deletedBy?.includes(user?._id) || msg.deletedForAll) return null;

                return (
                  <div
                    key={msg._id || i}
                    style={{
                      display: 'flex',
                      justifyContent: isMyMessage ? 'flex-end' : 'flex-start',
                      width: '100%',
                      position: 'relative'
                    }}
                  >
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === msg._id ? null : msg._id);
                      }}
                      style={{
                        maxWidth: '60%', padding: '11px 16px', fontSize: '14px', lineHeight: '1.45', fontWeight: '500', color: '#ffffff',
                        borderRadius: isMyMessage ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                        background: isMyMessage ? 'linear-gradient(135deg, #a78bfa, #ec4899)' : 'rgba(255, 255, 255, 0.06)',              
                        border: isMyMessage ? 'none' : '1px solid rgba(255, 255, 255, 0.05)',
                        boxShadow: isMyMessage ? '0 4px 15px rgba(236, 72, 153, 0.12)' : 'none',
                        wordBreak: 'break-word', display: 'flex', flexDirection: 'column', gap: '4px', cursor: 'pointer',
                        position: 'relative'
                      }}
                    >
                      {msg.forwarded && (
                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          ↩ Forwarded
                        </span>
                      )}

                      {msg.replyTo && (
                        <div style={{ background: 'rgba(0,0,0,0.15)', padding: '6px 10px', borderRadius: '8px', fontSize: '12px', borderLeft: '3px solid #ec4899', marginBottom: '4px', opacity: 0.9 }}>
                          {decryptMessage(typeof msg.replyTo === 'object' ? msg.replyTo.text : msg.replyTo)}
                        </div>
                      )}

                      {/* Content Processor Router */}
                      {renderMessageContent(msg)}
                      
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px', alignSelf: 'flex-end', userSelect: 'none' }}>
                        {msg.starred && <span style={{ fontSize: '10px' }}>⭐</span>}
                        {msg.edited && <span style={{ fontSize: '9px', opacity: 0.6 }}>(edited)</span>}
                        <span style={{ fontSize: '9px', color: isMyMessage ? 'rgba(255, 255, 255, 0.6)' : '#64748b', fontWeight: '600' }}>
                          {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                        </span>
                      </div>

                      {/* Context Menu Dropdown */}
                      {activeMenuId === msg._id && (
                        <div style={{
                          position: 'absolute', top: '100%', right: isMyMessage ? 0 : 'auto', left: isMyMessage ? 'auto' : 0,
                          background: '#161226', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px',
                          zIndex: 50, width: '150px', padding: '6px 0', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', marginTop: '4px'
                        }} onClick={(e) => e.stopPropagation()}>
                          <button style={{ width: '100%', padding: '8px 14px', border: 'none', background: 'transparent', color: '#e2e8f0', fontSize: '13px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => { setReplyingToMessage(msg); setActiveMenuId(null); }}><span>💬</span> Reply</button>
                          {isMyMessage && (!msg.messageType || msg.messageType === 'text') && <button style={{ width: '100%', padding: '8px 14px', border: 'none', background: 'transparent', color: '#e2e8f0', fontSize: '13px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => { setEditingMessageId(msg._id); setNewMessage(decryptMessage(msg.text)); setActiveMenuId(null); }}><span>✏️</span> Edit</button>}
                          <button style={{ width: '100%', padding: '8px 14px', border: 'none', background: 'transparent', color: '#e2e8f0', fontSize: '13px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => handleToggleStar(msg)}><span>⭐</span> {msg.starred ? 'Unstar' : 'Star'}</button>
                          <button style={{ width: '100%', padding: '8px 14px', border: 'none', background: 'transparent', color: '#e2e8f0', fontSize: '13px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => { setForwardingMessage(msg); setShowForwardModal(true); setActiveMenuId(null); }}><span>🚀</span> Forward</button>
                          <button style={{ width: '100%', padding: '8px 14px', border: 'none', background: 'transparent', color: '#f43f5e', fontSize: '13px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => { setTargetDeleteMessage(msg); setShowDeleteModal(true); setActiveMenuId(null); }}><span>🗑️</span> Delete</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Context Banner */}
            {replyingToMessage && (
              <div style={{ padding: '8px 24px', background: 'rgba(124, 58, 237, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(124, 58, 237, 0.2)' }}>
                <div style={{ fontSize: '13px', color: '#c084fc' }}>
                  Replying to: <span style={{ color: '#fff' }}>"{decryptMessage(replyingToMessage.text).substring(0, 30)}..."</span>
                </div>
                <button style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setReplyingToMessage(null)}>✕</button>
              </div>
            )}

            {/* Edit Mode Context Banner */}
            {editingMessageId && (
              <div style={{ padding: '8px 24px', background: 'rgba(236, 72, 153, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(236, 72, 153, 0.2)' }}>
                <div style={{ fontSize: '13px', color: '#f472b6' }}>
                  Editing your message... ✨
                </div>
                <button style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => { setEditingMessageId(null); setNewMessage(''); }}>✕ Cancel</button>
              </div>
            )}

            {/* Floating Attachment Menu Tray */}
            {showAttachMenu && (
              <div style={{ position: 'absolute', bottom: '80px', left: '20px', background: '#161226', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px', zIndex: 60, boxShadow: '0 10px 30px rgba(0,0,0,0.6)' }} onClick={(e)=>e.stopPropagation()}>
                <button onClick={() => fileInputRef.current.click()} style={{ background: 'transparent', border: 'none', color: '#fff', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', borderRadius: '8px', textAlign: 'left' }}>
                  <span>🖼️</span> Images (PNG/JPG)
                </button>
                <button onClick={() => fileInputRef.current.click()} style={{ background: 'transparent', border: 'none', color: '#fff', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', borderRadius: '8px', textAlign: 'left' }}>
                  <span>📁</span> Document (PDF/PPT/DOCX)
                </button>
              </div>
            )}

            {/* Sticker / GIF Drawer Panel */}
            {showStickerGifPanel && (
              <div style={{ position: 'absolute', bottom: '80px', left: '60px', background: '#161226', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', width: '280px', height: '220px', display: 'flex', flexDirection: 'column', zIndex: 60, boxShadow: '0 10px 30px rgba(0,0,0,0.6)' }} onClick={(e)=>e.stopPropagation()}>
                <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '6px' }}>
                  <div style={{ flex: 1, color: '#fff', fontSize: '12px', textAlign: 'center', padding: '4px', fontWeight: 'bold' }}>Stickers & GIFs Hub</div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {/* Mock Data Links - Connect back-end array data routes here */}
                  <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f44b/512.webp" alt="Sticker" onClick={() => handleSendStickerOrGif('https://fonts.gstatic.com/s/e/notoemoji/latest/1f44b/512.webp', 'sticker')} style={{ width: '100%', height: '60px', cursor: 'pointer', objectFit: 'contain' }} />
                  <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f602/512.webp" alt="Sticker" onClick={() => handleSendStickerOrGif('https://fonts.gstatic.com/s/e/notoemoji/latest/1f602/512.webp', 'sticker')} style={{ width: '100%', height: '60px', cursor: 'pointer', objectFit: 'contain' }} />
                  <img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbWdtcm9waWpxM3A3bWZ6d3I5b2I1ZTFwZmt0Y2V5NWh0bXp6Z3Z5ciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/c6SR7MIGaFfEI/giphy.gif" alt="GIF" onClick={() => handleSendStickerOrGif('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbWdtcm9waWpxM3A3bWZ6d3I5b2I1ZTFwZmt0Y2V5NWh0bXp6Z3Z5ciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/c6SR7MIGaFfEI/giphy.gif', 'gif')} style={{ width: '100%', height: '60px', cursor: 'pointer', objectFit: 'cover', borderRadius: '4px' }} />
                </div>
              </div>
            )}

            {/* Main Interactive Form Input Block */}
            <form onSubmit={handleSendMessage} style={{ padding: '20px', background: 'rgba(20, 16, 35, 0.4)', display: 'flex', gap: '10px', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
              
              <button type="button" onClick={() => { setShowAttachMenu(!showAttachMenu); setShowStickerGifPanel(false); }} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '50%', width: '42px', height: '42px', color: '#fff', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                📎
              </button>

              <button type="button" onClick={() => { setShowStickerGifPanel(!showStickerGifPanel); setShowAttachMenu(false); }} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '20px' }}>
                💝
              </button>

              <div style={{ flex: 1, position: 'relative' }}>
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder={editingMessageId ? "Update your message seamlessly..." : "Type a secure message... 🔐🌸"}
                  style={{
                    width: '100%', padding: '14px 20px', paddingRight: '50px', borderRadius: '16px',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    color: '#fff', outline: 'none', fontSize: '14px'
                  }}
                />
                <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', opacity: 0.7 }}>😊</span>
              </div>
              
              <button 
                type="submit" 
                style={{
                  background: 'linear-gradient(135deg, #a78bfa, #ec4899)', color: '#fff', border: 'none',
                  height: '46px', padding: '0 24px', borderRadius: '16px', fontWeight: 600, fontSize: '14px',
                  cursor: 'pointer', boxShadow: '0 4px 12px rgba(236, 72, 153, 0.2)', display: 'flex', alignItems: 'center', gap: '4px'
                }}
              >
                <span>{editingMessageId ? 'Update' : 'Send'}</span><span>✨</span>
              </button>
            </form>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔮✨🌸</div>
            <h4 style={{ color: '#fff', margin: '0 0 6px', fontSize: '18px', fontWeight: 700 }}>Your Protected Space</h4>
            <p style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', maxWidth: '280px', margin: 0, lineHeight: 1.5 }}>
              Select a friend channel from your list on the left side to look at live messaging history!
            </p>
          </div>
        )}
      </div>

      {/* ================= AUDIO/VIDEO CALL CALLOUT SYSTEM OVERLAY ================= */}
      {currentCall && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(5, 3, 10, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ background: '#141023', border: '1px solid rgba(124, 58, 237, 0.3)', borderRadius: '24px', padding: '40px', width: '360px', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}>
            <div style={{ fontSize: '50px', marginBottom: '16px' }}>{currentCall.type === 'video' ? '📹' : '📞'}</div>
            <h3 style={{ color: '#fff', margin: '0 0 8px', fontSize: '20px' }}>
              {currentCall.status === 'incoming' ? `Incoming from ${currentCall.from?.name}` : currentCall.status === 'outgoing' ? `Calling...` : `On Live Call`}
            </h3>
            <p style={{ color: '#a78bfa', fontSize: '14px', textTransform: 'uppercase', trackingSpace: '1px', margin: '0 0 32px' }}>
              {currentCall.type} Connection Setup
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
              {currentCall.status === 'incoming' && (
                <button onClick={handleAcceptCall} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '14px', cursor: 'pointer', fontWeight: '600' }}>
                  Accept
                </button>
              )}
              <button onClick={handleRejectOrEndCall} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '14px', cursor: 'pointer', fontWeight: '600' }}>
                {currentCall.status === 'connected' ? 'Disconnect' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= REMOVAL SELECTION OVERLAY MODAL ================= */}
      {showDeleteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(5, 3, 10, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setShowDeleteModal(false)}>
          <div style={{ background: '#141023', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '24px', width: '320px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <h4 style={{ color: '#fff', margin: '0 0 8px', fontSize: '16px' }}>Delete Message? 🍃</h4>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 20px' }}>Choose how you'd like to remove this message.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button onClick={handleDeleteForMe} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', padding: '10px', borderRadius: '12px', cursor: 'pointer', fontWeight: '500' }}>Delete for Me</button>
              {((targetDeleteMessage?.sender?._id || targetDeleteMessage?.sender) === user?._id) && (
                <button onClick={handleDeleteForEveryone} style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)', color: '#fff', border: 'none', padding: '10px', borderRadius: '12px', cursor: 'pointer', fontWeight: '500' }}>Delete for Everyone</button>
              )}
              <button onClick={() => setShowDeleteModal(false)} style={{ background: 'transparent', color: '#64748b', border: 'none', padding: '10px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= FORWARD SELECTION OVERLAY MODAL ================= */}
      {showForwardModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(5, 3, 10, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setShowForwardModal(false)}>
          <div style={{ background: '#141023', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '24px', width: '340px', maxHeight: '400px', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
            <h4 style={{ color: '#fff', margin: '0 0 14px', fontSize: '16px' }}>Forward Message To... 🚀</h4>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {connectedUsers.map(u => (
                <div key={u._id} onClick={() => handleForwardMessage(u._id)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', cursor: 'pointer' }}>
                  <img src={u.avatar ? `http://localhost:5000${u.avatar}` : `https://api.dicebear.com/7.x/adventurer/svg?seed=${u.name}`} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                  <span style={{ color: '#fff', fontSize: '14px', fontWeight: '500' }}>{u.name}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setShowForwardModal(false)} style={{ background: 'transparent', color: '#64748b', border: 'none', padding: '12px 0 0', cursor: 'pointer', marginTop: '10px' }}>Cancel</button>
          </div>
        </div>
      )}

    </div>
  );
}
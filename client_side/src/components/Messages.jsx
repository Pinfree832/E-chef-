import React, { useEffect, useState, useRef } from 'react';
import Sidebar from './common/Sidebar';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Messages() {
  const { user }   = useAuth();
  const { on, off, emit } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv]       = useState(null);
  const [messages, setMessages]           = useState([]);
  const [text, setText]                   = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    api.get('/messages/conversations').then(r => setConversations(r.data.data || []));

    const handler = (data) => {
      if (data.conversation_id === activeConv?.id) {
        setMessages(prev => [...prev, data.message]);
      }
      setConversations(prev => prev.map(c => c.id === data.conversation_id ? { ...c, last_message: data.message.content } : c));
    };
    on('new_message', handler);
    return () => off('new_message', handler);
  }, [activeConv, on, off]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function openConversation(conv) {
    setActiveConv(conv);
    const res = await api.get(`/messages/conversations/${conv.id}`);
    setMessages(res.data.data || []);
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!text.trim() || !activeConv) return;
    try {
      const res = await api.post('/messages/send', { recipient_id: activeConv.other_user_id, content: text, booking_id: activeConv.booking_id });
      setMessages(prev => [...prev, res.data.data.message]);
      setText('');
      setConversations(prev => prev.map(c => c.id === activeConv.id ? { ...c, last_message: text } : c));
    } catch { toast.error('Failed to send message'); }
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content" style={{ display: 'flex', height: '100vh' }}>
        {/* Conversation List */}
        <div style={{ width: 320, borderRight: '1px solid var(--border)', overflowY: 'auto', background: '#fff' }}>
          <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: 20 }}>Messages</h2>
          </div>
          {conversations.map(conv => (
            <div key={conv.id} onClick={() => openConversation(conv)} style={{
              padding: '14px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)',
              background: activeConv?.id === conv.id ? 'rgba(230,126,34,.08)' : 'transparent'
            }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, flexShrink: 0 }}>
                  {conv.other_first_name?.[0]}{conv.other_last_name?.[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong style={{ fontSize: 14 }}>{conv.other_first_name} {conv.other_last_name}</strong>
                    {conv.unread_count > 0 && (
                      <span style={{ background: 'var(--primary)', color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{conv.unread_count}</span>
                    )}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{conv.last_message || 'No messages yet'}</p>
                </div>
              </div>
            </div>
          ))}
          {conversations.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
              <p>No conversations yet.</p>
              <p style={{ fontSize: 13, marginTop: 8 }}>Start chatting with a chef or customer after booking.</p>
            </div>
          )}
        </div>

        {/* Chat Window */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {activeConv ? (
            <>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', background: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>
                  {activeConv.other_first_name?.[0]}
                </div>
                <strong>{activeConv.other_first_name} {activeConv.other_last_name}</strong>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', background: 'var(--bg)' }}>
                {messages.map(msg => {
                  const isMe = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
                      <div style={{
                        maxWidth: '65%', padding: '10px 14px', borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        background: isMe ? 'var(--primary)' : '#fff', color: isMe ? '#fff' : 'var(--text-primary)',
                        boxShadow: 'var(--shadow-sm)', fontSize: 14
                      }}>
                        {msg.content}
                        <div style={{ fontSize: 11, opacity: .7, marginTop: 4, textAlign: isMe ? 'right' : 'left' }}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={sendMessage} style={{ padding: '16px 24px', background: '#fff', borderTop: '1px solid var(--border)', display: 'flex', gap: 12 }}>
                <input className="form-control" placeholder="Type a message..." value={text} onChange={e => setText(e.target.value)} />
                <button type="submit" className="btn btn-primary" disabled={!text.trim()}>Send</button>
              </form>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: 64 }}>💬</div>
              <h3>Select a conversation</h3>
              <p>Choose a chat from the left panel to start messaging.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

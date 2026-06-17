import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user }           = useAuth();
  const socketRef          = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; setConnected(false); }
      return;
    }

    const token = localStorage.getItem('accessToken');
    socketRef.current = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketRef.current.on('connect',    () => setConnected(true));
    socketRef.current.on('disconnect', () => setConnected(false));

    return () => { socketRef.current?.disconnect(); setConnected(false); };
  }, [user]);

  const on = (event, handler) => socketRef.current?.on(event, handler);
  const off = (event, handler) => socketRef.current?.off(event, handler);
  const emit = (event, data)  => socketRef.current?.emit(event, data);
  const joinBooking = (id)    => socketRef.current?.emit('join_booking', id);
  const leaveBooking = (id)   => socketRef.current?.emit('leave_booking', id);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, on, off, emit, joinBooking, leaveBooking }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);

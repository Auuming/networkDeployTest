import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import LoginScreen from './components/LoginScreen';
import ChatInterface from './components/ChatInterface';

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [clientName, setClientName] = useState<string>('');
  const [serverUrl, setServerUrl] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const savedServerUrl = localStorage.getItem('serverUrl') || '';
    if (savedServerUrl) {
      setServerUrl(savedServerUrl);
    } else {
      // Use environment variable if available (for production), otherwise use localhost
      const envServerUrl = import.meta.env.VITE_SERVER_URL;
      if (envServerUrl) {
        setServerUrl(envServerUrl);
      } else {
        const hostname = window.location.hostname;
        const defaultPort = '3001';
        setServerUrl(`http://${hostname}:${defaultPort}`);
      }
    }
  }, []);

  const handleLogin = (name: string, age: number, url: string) => {
    setError('');
    
    if (!name || name.trim().length === 0) {
      setError('Please enter your name');
      return;
    }

    if (!age || age < 1 || age > 150) {
      setError('Please enter a valid age (1-150)');
      return;
    }

    if (!url || url.trim().length === 0) {
      setError('Please enter server URL');
      return;
    }

    localStorage.setItem('serverUrl', url);

    const newSocket = io(url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
      
      newSocket.emit('register', { name: name.trim(), age }, (response: { success: boolean; error?: string }) => {
        if (response.success) {
          setClientName(name.trim());
          setSocket(newSocket);
          setIsConnected(true);
          setError('');
        } else {
          setError(response.error || 'Registration failed');
          newSocket.disconnect();
        }
      });
    });

    newSocket.on('connect_error', (err) => {
      setError(`Connection failed: ${err.message}. Make sure the server is running.`);
      newSocket.disconnect();
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(newSocket);
  };

  const handleLogout = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setClientName('');
      setIsConnected(false);
    }
  };

  if (!isConnected || !socket) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        serverUrl={serverUrl}
        error={error}
      />
    );
  }

  return (
    <ChatInterface
      socket={socket}
      clientName={clientName}
      onLogout={handleLogout}
    />
  );
}

export default App;


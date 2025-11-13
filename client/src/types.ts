import { Socket } from 'socket.io-client';

export interface Client {
  name: string;
  socketId: string;
  age: number;
}

export interface GroupMember {
  name: string;
  socketId: string;
  age?: number;
}

export interface GroupCreator {
  name: string;
  socketId: string;
  age?: number;
}

export interface Group {
  groupId: string;
  name: string;
  creator: GroupCreator;
  members: GroupMember[];
  minimumAge?: number;
}

export interface Message {
  sender: string;
  message: string;
  timestamp: string;
  isOwn: boolean;
}

export interface ActiveChat {
  type: 'private' | 'group';
  id: string;
  name: string;
}

export interface PrivateMessageData {
  roomId: string;
  sender: GroupMember;
  recipient: GroupMember;
  message: string;
  timestamp: string;
}

export interface GroupMessageData {
  groupId: string;
  sender: GroupMember;
  message: string;
  timestamp: string;
}

export interface ChatInterfaceProps {
  socket: Socket;
  clientName: string;
  onLogout: () => void;
}


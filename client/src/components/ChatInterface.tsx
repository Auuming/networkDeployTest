import { useState, useEffect } from "react";
import { Socket } from "socket.io-client";
import ClientList from "./ClientList";
import ChatRoom from "./ChatRoom";
import GroupManager from "./GroupManager";
import ThemeToggle from "./ThemeToggle";
import {
  Client,
  Group,
  ActiveChat,
  Message,
  PrivateMessageData,
  GroupMessageData,
} from "../types";

interface ChatInterfaceProps {
  socket: Socket;
  clientName: string;
  onLogout: () => void;
}

function ChatInterface({ socket, clientName, onLogout }: ChatInterfaceProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeChat, setActiveChat] = useState<ActiveChat | null>(null);
  const [messages, setMessages] = useState<Map<string, Message[]>>(new Map());
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [typingUsers, setTypingUsers] = useState<Map<string, Set<string>>>(new Map());

  useEffect(() => {
    console.log("ChatInterface mounted, socket ID:", socket.id);
    console.log("Socket connected:", socket.connected);

    socket.on("clientList", (clientList: Client[]) => {
      console.log("Received client list:", clientList);
      setClients(clientList);
    });

    socket.on("clientJoined", (client: Client) => {
      setClients((prev) => {
        const exists = prev.find((c) => c.socketId === client.socketId);
        if (!exists) {
          return [...prev, client];
        }
        return prev;
      });
    });

    socket.on("clientLeft", (client: Client) => {
      setClients((prev) => prev.filter((c) => c.socketId !== client.socketId));
    });

    socket.on("groupList", (groupList: Group[]) => {
      setGroups(groupList);
    });

    socket.on("groupCreated", (group: Group) => {
      setGroups((prev) => {
        const exists = prev.find((g) => g.groupId === group.groupId);
        if (!exists) {
          return [...prev, group];
        }
        return prev;
      });
    });

    socket.on("groupUpdated", (group: Group) => {
      setGroups((prev) =>
        prev.map((g) => (g.groupId === group.groupId ? group : g))
      );
    });

    socket.on("groupDeleted", ({ groupId }: { groupId: string }) => {
      setGroups((prev) => prev.filter((g) => g.groupId !== groupId));
      if (activeChat?.type === "group" && activeChat.id === groupId) {
        setActiveChat(null);
      }
    });

    socket.on("privateMessage", (messageData: PrivateMessageData) => {
      const {
        roomId,
        sender,
        message,
        timestamp,
        recipient,
        messageId,
        reactions,
      } = messageData;
      console.log("Received private message:", messageData);

      if (sender.socketId !== socket.id && recipient.socketId === socket.id) {
        const senderClient = clients.find(
          (c) => c.socketId === sender.socketId
        );
        if (
          senderClient &&
          (!activeChat ||
            activeChat.id !== sender.socketId ||
            activeChat.type !== "private")
        ) {
          console.log("Auto-opening chat with:", senderClient);
          setActiveChat({
            type: "private",
            id: sender.socketId,
            name: sender.name,
          });
        }
      }

      setMessages((prev) => {
        const newMessages = new Map(prev);
        const roomMessages = newMessages.get(roomId) || [];

        const existingIndex = roomMessages.findIndex(
          (msg) =>
            msg.messageId === messageId ||
            (msg.messageId?.startsWith("temp-") &&
              msg.message === message &&
              msg.sender === sender.name &&
              Math.abs(
                new Date(msg.timestamp).getTime() -
                  new Date(timestamp).getTime()
              ) < 2000)
        );

        if (existingIndex >= 0) {
          if (
            roomMessages[existingIndex].messageId?.startsWith("temp-") &&
            messageId
          ) {
            roomMessages[existingIndex] = {
              ...roomMessages[existingIndex],
              messageId,
              reactions:
                reactions || roomMessages[existingIndex].reactions || {},
            };
            newMessages.set(roomId, [...roomMessages]);
          }
        } else {
          console.log("Adding message to room:", roomId);
          newMessages.set(roomId, [
            ...roomMessages,
            {
              sender: sender.name,
              message,
              timestamp,
              isOwn: sender.socketId === socket.id,
              messageId,
              reactions: reactions || {},
            },
          ]);
        }
        return newMessages;
      });
    });

    socket.on("groupMessage", (messageData: GroupMessageData) => {
      const { groupId, sender, message, timestamp, messageId, reactions } =
        messageData;
      console.log("Received group message:", messageData);

      setMessages((prev) => {
        const newMessages = new Map(prev);
        const roomMessages = newMessages.get(groupId) || [];

        const existingIndex = roomMessages.findIndex(
          (msg) =>
            msg.messageId === messageId ||
            (msg.messageId?.startsWith("temp-") &&
              msg.message === message &&
              msg.sender === sender.name &&
              Math.abs(
                new Date(msg.timestamp).getTime() -
                  new Date(timestamp).getTime()
              ) < 2000)
        );

        if (existingIndex >= 0) {
          if (
            roomMessages[existingIndex].messageId?.startsWith("temp-") &&
            messageId
          ) {
            roomMessages[existingIndex] = {
              ...roomMessages[existingIndex],
              messageId,
              reactions:
                reactions || roomMessages[existingIndex].reactions || {},
            };
            newMessages.set(groupId, [...roomMessages]);
          }
        } else {
          newMessages.set(groupId, [
            ...roomMessages,
            {
              sender: sender.name,
              message,
              timestamp,
              isOwn: sender.socketId === socket.id,
              messageId,
              reactions: reactions || {},
            },
          ]);
        }
        return newMessages;
      });
    });

    socket.on(
      "reactionUpdate",
      ({
        messageId,
        reactions,
      }: {
        messageId: string;
        reactions: Record<string, string[]>;
      }) => {
        setMessages((prev) => {
          const newMessages = new Map(prev);
          let updated = false;

          newMessages.forEach((roomMessages, roomKey) => {
            const updatedMessages = roomMessages.map((msg) => {
              if (msg.messageId === messageId) {
                updated = true;
                return { ...msg, reactions };
              }
              return msg;
            });
            if (updated) {
              newMessages.set(roomKey, updatedMessages);
            }
          });

          return updated ? newMessages : prev;
        });
      }
    );

    socket.on("error", ({ message }: { message: string }) => {
      alert(`Error: ${message}`);
    });

    // Typing indicator listeners for private messages
    socket.on("privateTypingStart", ({ sender }: { sender: { name: string; socketId: string } }) => {
      if (sender.socketId === socket.id) return; // Don't show own typing indicator
      
      const roomId = [socket.id, sender.socketId].sort().join("-");
      setTypingUsers((prev) => {
        const newTypingUsers = new Map(prev);
        const typingSet = newTypingUsers.get(roomId) || new Set<string>();
        typingSet.add(sender.name);
        newTypingUsers.set(roomId, typingSet);
        return newTypingUsers;
      });
    });

    socket.on("privateTypingStop", ({ sender }: { sender: { name: string; socketId: string } }) => {
      if (sender.socketId === socket.id) return;
      
      const roomId = [socket.id, sender.socketId].sort().join("-");
      setTypingUsers((prev) => {
        const newTypingUsers = new Map(prev);
        const typingSet = newTypingUsers.get(roomId);
        if (typingSet) {
          typingSet.delete(sender.name);
          if (typingSet.size === 0) {
            newTypingUsers.delete(roomId);
          } else {
            newTypingUsers.set(roomId, typingSet);
          }
        }
        return newTypingUsers;
      });
    });

    // Typing indicator listeners for group messages
    socket.on("groupTypingStart", ({ groupId, sender }: { groupId: string; sender: { name: string; socketId: string } }) => {
      if (sender.socketId === socket.id) return; // Don't show own typing indicator
      
      setTypingUsers((prev) => {
        const newTypingUsers = new Map(prev);
        const typingSet = newTypingUsers.get(groupId) || new Set<string>();
        typingSet.add(sender.name);
        newTypingUsers.set(groupId, typingSet);
        return newTypingUsers;
      });
    });

    socket.on("groupTypingStop", ({ groupId, sender }: { groupId: string; sender: { name: string; socketId: string } }) => {
      if (sender.socketId === socket.id) return;
      
      setTypingUsers((prev) => {
        const newTypingUsers = new Map(prev);
        const typingSet = newTypingUsers.get(groupId);
        if (typingSet) {
          typingSet.delete(sender.name);
          if (typingSet.size === 0) {
            newTypingUsers.delete(groupId);
          } else {
            newTypingUsers.set(groupId, typingSet);
          }
        }
        return newTypingUsers;
      });
    });

    return () => {
      socket.off("clientList");
      socket.off("clientJoined");
      socket.off("clientLeft");
      socket.off("groupList");
      socket.off("groupCreated");
      socket.off("groupUpdated");
      socket.off("groupDeleted");
      socket.off("privateMessage");
      socket.off("groupMessage");
      socket.off("reactionUpdate");
      socket.off("error");
      socket.off("privateTypingStart");
      socket.off("privateTypingStop");
      socket.off("groupTypingStart");
      socket.off("groupTypingStop");
    };
  }, [socket, activeChat, clients]);

  const handlePrivateChat = (recipient: Client) => {
    if (recipient.socketId === socket.id) {
      alert("You cannot send a private message to yourself.");
      return;
    }
    setActiveChat({
      type: "private",
      id: recipient.socketId,
      name: recipient.name,
    });
    setSidebarOpen(false);
  };

  const handleGroupChat = (group: Group) => {
    setActiveChat({
      type: "group",
      id: group.groupId,
      name: group.name,
    });
    setSidebarOpen(false);
  };

  const sendMessage = (messageText: string) => {
    if (!messageText.trim() || !activeChat) return;

    const trimmedMessage = messageText.trim();
    const timestamp = new Date().toISOString();

    if (activeChat.type === "private") {
      const roomId = [socket.id, activeChat.id].sort().join("-");
      const tempMessageId = `temp-${Date.now()}-${Math.random()}`;
      setMessages((prev) => {
        const newMessages = new Map(prev);
        const roomMessages = newMessages.get(roomId) || [];
        newMessages.set(roomId, [
          ...roomMessages,
          {
            sender: clientName,
            message: trimmedMessage,
            timestamp,
            isOwn: true,
            messageId: tempMessageId,
            reactions: {},
          },
        ]);
        return newMessages;
      });

      socket.emit("privateMessage", {
        recipientId: activeChat.id,
        message: trimmedMessage,
      });
    } else if (activeChat.type === "group") {
      const tempMessageId = `temp-${Date.now()}-${Math.random()}`;
      setMessages((prev) => {
        const newMessages = new Map(prev);
        const roomMessages = newMessages.get(activeChat.id) || [];
        newMessages.set(activeChat.id, [
          ...roomMessages,
          {
            sender: clientName,
            message: trimmedMessage,
            timestamp,
            isOwn: true,
            messageId: tempMessageId,
            reactions: {},
          },
        ]);
        return newMessages;
      });

      socket.emit("groupMessage", {
        groupId: activeChat.id,
        message: trimmedMessage,
      });
    }
  };

  const handleGroupCreated = (group: Group) => {
    setGroups((prev) => {
      const exists = prev.find((g) => g.groupId === group.groupId);
      if (!exists) {
        return [...prev, group];
      }
      return prev;
    });
    setActiveChat({
      type: "group",
      id: group.groupId,
      name: group.name,
    });
    setSidebarOpen(false);
  };

  const handleGroupJoined = (group: Group) => {
    setGroups((prev) =>
      prev.map((g) => (g.groupId === group.groupId ? group : g))
    );
    setActiveChat({
      type: "group",
      id: group.groupId,
      name: group.name,
    });
    setSidebarOpen(false);
  };

  const getCurrentMessages = (): Message[] => {
    if (!activeChat) return [];

    let messageKey: string;
    if (activeChat.type === "private") {
      const roomId = [socket.id, activeChat.id].sort().join("-");
      messageKey = roomId;
    } else {
      messageKey = activeChat.id;
    }

    return messages.get(messageKey) || [];
  };

  const getCurrentTypingUsers = (): string[] => {
    if (!activeChat) return [];

    let messageKey: string;
    if (activeChat.type === "private") {
      const roomId = [socket.id, activeChat.id].sort().join("-");
      messageKey = roomId;
    } else {
      messageKey = activeChat.id;
    }

    const typingSet = typingUsers.get(messageKey);
    return typingSet ? Array.from(typingSet) : [];
  };

  const currentMessages = getCurrentMessages();
  const currentTypingUsers = getCurrentTypingUsers();

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden md:rounded-xl border border-gray-200 dark:border-gray-800">
      <div className="bg-[#00C300] dark:bg-gray-800 border-b border-[#00B300] dark:border-gray-700 text-white p-5 flex justify-between items-center shadow-md">
        <button
          className="md:hidden bg-white/20 border-2 border-white text-white px-3 py-2 rounded-md text-lg font-semibold transition-all hover:bg-white hover:text-[#00C300] dark:hover:text-gray-800"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle menu"
        >
          ☰
        </button>
        <h1 className="text-xl md:text-2xl font-semibold flex-1 text-center md:text-left md:ml-4">
          LineNai WongMan - {clientName}
        </h1>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={onLogout}
            className="bg-white/20 border-2 border-white text-white px-5 py-2 rounded-md text-xs md:text-sm font-medium transition-all hover:bg-white hover:text-[#00C300] dark:hover:text-gray-800"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        <div
          className={`fixed md:static inset-y-0 left-0 w-full md:w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden z-[100] transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <ClientList
            clients={clients}
            currentClientId={socket.id || ""}
            onSelectClient={handlePrivateChat}
          />

          <GroupManager
            socket={socket}
            groups={groups}
            currentClientId={socket.id || ""}
            onSelectGroup={handleGroupChat}
            onGroupCreated={handleGroupCreated}
            onGroupJoined={handleGroupJoined}
          />
        </div>

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-[99] md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div className="flex-1 flex flex-col overflow-hidden bg-[#F5F5F5] dark:bg-gray-900">
          {activeChat ? (
            <ChatRoom
              chat={activeChat}
              messages={currentMessages}
              onSendMessage={sendMessage}
              currentClientName={clientName}
              socket={socket}
              currentSocketId={socket.id || ""}
              typingUsers={currentTypingUsers}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400 text-lg md:text-xl p-5 text-center">
              Select a client or group to start chatting
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatInterface;

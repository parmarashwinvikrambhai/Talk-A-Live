import {
  Bell,
  ChevronLeft,
  CircleUserRound,
  Eye,
  Search,
  SendHorizontal,
  CheckCheck,
  Smile,
  Mic,
  Square,
  Play,
  Pause,
  Volume2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import ProfileModal from "../components/ProfileModal";
import NewGroupModal from "../components/NewGroupModal";
import GroupInfoModal from "../components/GroupInfoModal";
import { getProfile, searchUsers, LogoutUser } from "../api/auth";
import { accessChat, fetchChats } from "../api/chat";
import { fetchMessages, sendMessage } from "../api/message";
import { useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import toast from "react-hot-toast";
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";
import { useReactMediaRecorder } from "react-media-recorder";

import type { User, Chat, Message } from "../types/chat.types";

const ENDPOINT = "http://localhost:4000";

function Chat() {
  const navigate = useNavigate();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);

  const {
    status: recordingStatus,
    startRecording,
    stopRecording,
    mediaBlobUrl,
    clearBlobUrl,
  } = useReactMediaRecorder({ audio: true });

  const [allChats, setAllChats] = useState<Chat[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [loggedUser, setLoggedUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("userInfo");
    try {
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      // If it's the full response from login, return the user part
      return parsed.user ? parsed.user : parsed;
    } catch {
      return null;
    }
  });
  const [notifications, setNotifications] = useState<Message[]>([]);

  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const notificationRef = useRef<HTMLDivElement | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const selectedChatCompareRef = useRef<string | null>(null);
  const typingRef = useRef(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typingTimeoutRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const localAudioUrls = useRef<Map<string, string>>(new Map());
  const capturedDurationRef = useRef<string>("0:00");

  const handleProfileOpen = () => {
    setIsProfileModalOpen(true);
    setIsProfileMenuOpen(false);
  };

  const getChats = useCallback(async () => {
    setLoadingChats(true);
    try {
      const data = await fetchChats();
      setAllChats(data);
    } catch (error) {
      console.error("Failed to fetch chats:", error);
    } finally {
      setLoadingChats(false);
    }
  }, []);

  const loggedUserRef = useRef<User | null>(null);

  const handleSendVoiceMessage = useCallback(
    async (blobUrl: string) => {
      if (!selectedChat) return;
      const duration = capturedDurationRef.current;
      console.log("CHAT: Sending voice message, duration:", duration);
      try {
        const audioBlob = await fetch(blobUrl).then((r) => r.blob());
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          try {
            console.log("CHAT: Calling sendMessage API with isAudio=true");
            const data = await sendMessage(
              base64Audio,
              selectedChat,
              true, // isAudio
              duration,
            );
            console.log("CHAT: sendMessage response received:", {
              id: data._id,
              isAudio: data.isAudio,
              contentPreview: data.content?.substring(0, 30),
            });

            // Store the blob URL locally for playback by sender
            localAudioUrls.current.set(data._id, blobUrl);
            if (socketRef.current?.connected && data && data.chat) {
              socketRef.current.emit("new message", data);
            }
            setMessages((prev) => {
              const exists = prev.find((m) => m._id === data._id);
              if (exists) return prev;
              return [...prev, data];
            });
            setAllChats((prev) => {
              const chatIdx = prev.findIndex(
                (c) => c._id?.toString() === selectedChat.toString(),
              );
              if (chatIdx === -1) return prev;
              const updated = [...prev];
              updated[chatIdx] = { ...updated[chatIdx], latestMessage: data };
              const [moved] = updated.splice(chatIdx, 1);
              return [moved, ...updated];
            });
            clearBlobUrl();
          } catch (error) {
            console.error("Failed to send voice message:", error);
            toast.error("Failed to send voice message");
          }
        };
      } catch (error) {
        console.error("Error processing voice message:", error);
      }
    },
    [selectedChat, clearBlobUrl],
  );

  useEffect(() => {
    if (mediaBlobUrl && !isRecording && recordingStatus === "stopped") {
      handleSendVoiceMessage(mediaBlobUrl);
    }
  }, [mediaBlobUrl, isRecording, recordingStatus, handleSendVoiceMessage]);

  // Use a ref to keep track of the playing audio to avoid restarting on message list updates
  const playingAudioIdRef = useRef<string | null>(null);

  useEffect(() => {
    // If no active audio, stop anything playing
    if (!activeAudioId) {
      if (audioRef.current) {
        console.log("CHAT: Stopping audio playback");
        audioRef.current.pause();
        audioRef.current = null;
      }
      playingAudioIdRef.current = null;
      return;
    }

    // If we're already playing this message, don't restart it just because the messages array changed
    if (activeAudioId === playingAudioIdRef.current && audioRef.current) {
      return;
    }

    const msg = messages.find((m) => m._id === activeAudioId);
    if (msg && (msg.isAudio || msg.content?.startsWith("data:audio"))) {
      if (audioRef.current) {
        audioRef.current.pause();
      }

      playingAudioIdRef.current = activeAudioId;

      // Use local blob URL if available (sender side), otherwise use content
      let audioSrc = localAudioUrls.current.get(activeAudioId) || msg.content;

      // Fix potential MIME type mismatch: if content starts with WebM header GkXf but says audio/wav
      if (audioSrc?.startsWith("data:audio/wav;base64,GkXf")) {
        console.log("CHAT: Correcting WAV to WEBM MIME type");
        audioSrc = audioSrc.replace("data:audio/wav", "data:audio/webm");
      }

      console.log(
        "CHAT: Playing audio. Source preview:",
        audioSrc?.substring(0, 50),
      );

      if (!audioSrc) {
        console.error("CHAT: No audio source found");
        setActiveAudioId(null);
        return;
      }

      const audio = new Audio(audioSrc);
      audioRef.current = audio;
      audio.volume = 1.0;

      audio.onloadedmetadata = () => {
        console.log("CHAT: Audio metadata loaded. Duration:", audio.duration);
      };

      audio.onended = () => {
        console.log("CHAT: Audio playback ended naturally");
        setActiveAudioId(null);
      };

      audio
        .play()
        .then(() => console.log("CHAT: Audio playback started"))
        .catch((err) => {
          console.error("CHAT: Audio playback error:", err);
          setActiveAudioId(null);
        });
    } else {
      setActiveAudioId(null);
    }
  }, [activeAudioId, messages]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Generate stable waveform bar heights seeded by message ID
  const getWaveformHeights = (id: string, count: number = 20): number[] => {
    const heights: number[] = [];
    let seed = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    for (let i = 0; i < count; i++) {
      seed = (seed * 1664525 + 1013904223) & 0xffffffff;
      heights.push(20 + Math.abs(seed % 80));
    }
    return heights;
  };

  const fetchLoggedUser = async () => {
    try {
      const data = await getProfile();
      // Only update state if user ID actually changed (prevents socket re-init)
      setLoggedUser((prev) => {
        if (prev?._id === data.user._id) return prev;
        return data.user;
      });
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    }
  };

  // Keep ref in sync with state
  useEffect(() => {
    loggedUserRef.current = loggedUser;
  }, [loggedUser]);

  // 1. Initial Data Load & Toast Cleanup
  useEffect(() => {
    // Clear all lingering toasts ONLY ONCE on mount
    toast.remove();
    console.log("CHAT: Initial mount cleanup");

    const init = async () => {
      await fetchLoggedUser();
      await getChats();
    };
    init();

    // Small delay to catch any late transitions
    const timeoutId = setTimeout(() => toast.remove(), 1000);
    return () => clearTimeout(timeoutId);
  }, [getChats]); // Corrected dependency array

  const playNotificationSound = () => {
    const audio = new Audio(
      "https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3",
    );
    audio.play().catch((err) => console.log("Sound play error:", err));
  };

  // 1. Singleton Socket Lifecycle & Persistent Listeners
  useEffect(() => {
    const userId = loggedUser?._id;
    if (!userId) return;

    if (!socketRef.current) {
      console.log(
        "SOCKET: Initializing permanent singleton with handshake auth for user:",
        userId,
      );

      // Extract token from localStorage for handshake
      let token = "";
      const saved = localStorage.getItem("userInfo");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          token = parsed.token || "";
        } catch (e) {
          console.error("SOCKET: Failed to parse userInfo for token", e);
        }
      }

      const socketInstance = io(ENDPOINT, {
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        auth: { token }, // <--- SEND TOKEN DURING HANDSHAKE
      });

      socketRef.current = socketInstance;

      // --- PERSISTENT LISTENERS (Attached only once) ---

      socketInstance.on("connect", () => {
        console.log("SOCKET: Connected ID:", socketInstance.id);
        setSocketConnected(true);

        const userData = loggedUserRef.current;
        // Even though we join automatically on server, we still emit 'setup'
        // if the server expects it for confirmation/legacy reasons.
        if (userData) socketInstance.emit("setup", userData);

        const currentChatId = selectedChatCompareRef.current;
        if (currentChatId) socketInstance.emit("join chat", currentChatId);
      });

      socketInstance.on("disconnect", (reason) => {
        console.log(
          "SOCKET: Disconnected. Reason:",
          reason,
          "at",
          new Date().toLocaleTimeString(),
        );
        setSocketConnected(false);
      });

      socketInstance.on("connected", () =>
        console.log("SOCKET: Server confirmed setup"),
      );

      socketInstance.on("typing", () => setIsTyping(true));
      socketInstance.on("stop typing", () => setIsTyping(false));

      socketInstance.on("message recieved", (newMessageRecieved: Message) => {
        const chatData = newMessageRecieved.chat;
        const incomingChatId = (chatData?._id || chatData)?.toString();
        const currentLoggedUserId = loggedUserRef.current?._id;

        if (!incomingChatId) return;

        // Play sound for others' messages
        if (newMessageRecieved.sender?._id !== currentLoggedUserId) {
          playNotificationSound();
        }

        // 1. Update Chat List
        setAllChats((prev) => {
          const index = prev.findIndex(
            (c) => c._id.toString() === incomingChatId.toString(),
          );

          if (index === -1) {
            // If chat data is just an ID string, we might need to fetch the full chat
            // but for now we try to use the chatData if it's an object
            if (typeof chatData === "object" && chatData._id) {
              return [
                { ...chatData, latestMessage: newMessageRecieved },
                ...prev,
              ];
            }
            return prev; // Or trigger a full getChats() here
          }

          const updated = [...prev];
          updated[index] = {
            ...(typeof chatData === "object" ? chatData : updated[index]),
            latestMessage: newMessageRecieved,
          };
          const [moved] = updated.splice(index, 1);
          return [moved, ...updated];
        });

        // 2. Add to Notifications
        setNotifications((prev) => {
          if (!prev.find((n) => n._id === newMessageRecieved._id)) {
            return [newMessageRecieved, ...prev];
          }
          return prev;
        });

        // 3. Update active thread if open
        if (
          selectedChatCompareRef.current?.toString() ===
          incomingChatId.toString()
        ) {
          setMessages((prev) => {
            if (prev.find((m) => m._id === newMessageRecieved._id)) return prev;
            return [...prev, newMessageRecieved];
          });
        }
      });

      socketInstance.on("connect_error", (err) =>
        console.error("SOCKET: Error:", err),
      );
    }

    return () => {}; // Singleton, no cleanup on re-render
  }, [loggedUser?._id]);

  // Final unmount cleanup
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        console.log("SOCKET: Final Unmount - Disconnecting");
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocketConnected(false);
      }
    };
  }, []);

  // No longer needed: Listeners are now attached once in the singleton effect.

  const getSender = (loggedUser: User | null, users: User[]) => {
    return users[0]?._id === loggedUser?._id ? users[1]?.name : users[0]?.name;
  };

  useEffect(() => {
    if (!searchTerm.trim()) {
      setRegisteredUsers([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoadingSearch(true);
      try {
        const data = await searchUsers(searchTerm);
        setRegisteredUsers(data);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setLoadingSearch(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  useEffect(() => {
    if (!isProfileMenuOpen) return;

    const handleClick = (e: MouseEvent) => {
      const el = profileMenuRef.current;
      if (el && !el.contains(e.target as Node)) setIsProfileMenuOpen(false);
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsProfileMenuOpen(false);
    };

    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isProfileMenuOpen]);

  useEffect(() => {
    if (!isNotificationOpen) return;

    const handleClick = (e: MouseEvent) => {
      const el = notificationRef.current;
      if (el && !el.contains(e.target as Node)) setIsNotificationOpen(false);
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsNotificationOpen(false);
    };

    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isNotificationOpen]);

  useEffect(() => {
    if (!isSearchOpen) return;

    const handleClick = (e: MouseEvent) => {
      const el = searchRef.current;
      if (el && !el.contains(e.target as Node)) {
        setIsSearchOpen(false);
        setSearchTerm("");
      }
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsSearchOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isSearchOpen]);

  useEffect(() => {
    if (!showEmojiPicker) return;

    const handleClick = (e: MouseEvent) => {
      const el = emojiPickerRef.current;
      if (el && !el.contains(e.target as Node)) setShowEmojiPicker(false);
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowEmojiPicker(false);
    };

    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [showEmojiPicker]);

  const getMessages = useCallback(async () => {
    if (!selectedChat) return;
    setLoadingMessages(true);
    try {
      const data = await fetchMessages(selectedChat);
      setMessages(data);
      if (socketRef.current && socketConnected) {
        socketRef.current.emit("join chat", selectedChat);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setLoadingMessages(false);
    }
  }, [selectedChat, socketConnected]);

  useEffect(() => {
    getMessages();
    selectedChatCompareRef.current = selectedChat;
    setShowEmojiPicker(false);
  }, [selectedChat, getMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleChatClick = (chatId: string) => {
    setSelectedChat(chatId);
    setNotifications((prev) =>
      prev.filter(
        (n) => (n.chat._id || n.chat)?.toString() !== chatId.toString(),
      ),
    );
  };

  const handleAccessChat = async (userId: string) => {
    console.log("Accessing chat for userId:", userId);
    try {
      const data = await accessChat(userId);
      console.log("Chat data received:", data);
      if (!allChats.find((c: Chat) => c._id === data._id)) {
        setAllChats([data, ...allChats]);
      }
      setSelectedChat(data._id);
      setIsSearchOpen(false);
      setSearchTerm("");
    } catch (error) {
      console.error("Failed to access chat:", error);
      alert("Chat access fail ho gayi!");
    }
  };

  const handleSendMessage = async () => {
    if (message.trim() && selectedChat && socketRef.current) {
      const content = message.trim();
      setMessage("");

      if (typingRef.current) {
        socketRef.current.emit("stop typing", selectedChat);
        typingRef.current = false;
      }

      try {
        console.log("CHAT: Sending message to API...");
        const data = await sendMessage(content, selectedChat);
        console.log("CHAT: Message sent successfully, data:", data);

        if (socketRef.current?.connected && data && data.chat) {
          console.log("CHAT: Emitting 'new message' to socket...");
          socketRef.current.emit("new message", data);
        } else {
          console.warn(
            "CHAT: Socket not connected or invalid data, could not emit 'new message'",
          );
        }

        setMessages((prev) => {
          const exists = prev.find((m) => m._id === data._id);
          if (exists) return prev;
          return [...prev, data];
        });

        setAllChats((prev) => {
          console.log("CHAT: Updating allChats list...");
          const chatIdx = prev.findIndex(
            (c) => (c._id?.toString() || "") === selectedChat.toString(),
          );
          if (chatIdx === -1) {
            console.log("CHAT: Chat not found in list, might be a new chat");
            return prev;
          }
          const updatedChats = [...prev];
          updatedChats[chatIdx] = {
            ...updatedChats[chatIdx],
            latestMessage: data,
          };
          const [moved] = updatedChats.splice(chatIdx, 1);
          return [moved, ...updatedChats];
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.error("CHAT: Failed to send message error details:", error);
        console.error("error.response:", error.response?.data);
        alert("Message send nahi ho paya! Check console for errors.");
        setMessage(content); // Restore content on fail
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const selectedChatData = allChats.find(
    (chat: Chat) => chat._id === selectedChat,
  );
  const filteredChats = allChats.filter((chat: Chat) => {
    const chatName = chat.isGroupChat
      ? chat.chatName
      : getSender(loggedUser, chat.users);
    return chatName?.toLowerCase().includes(searchTerm.toLowerCase().trim());
  });
  const filteredUsers = registeredUsers;

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Background Pattern */}
      <div className="fixed inset-0 bg-blue-50 opacity-50 pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full opacity-30 blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full opacity-30 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-white rounded-full opacity-20 blur-3xl"></div>
      </div>

      <div className="relative flex h-screen">
        {/* Left Sidebar - Chat List */}
        <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div
              ref={searchRef}
              className="flex items-center gap-3 flex-1"
              onMouseDown={() => {
                if (!isSearchOpen) setIsSearchOpen(true);
              }}
            >
              {isSearchOpen ? (
                <>
                  <input
                    type="text"
                    autoFocus
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search chats..."
                    className="w-full max-w-[280px] px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setIsSearchOpen(true)}
                    className="p-1 hover:bg-gray-100 rounded-full"
                  >
                    <Search className="w-5 h-5 text-gray-600" />
                  </button>
                  <h1 className="text-xl font-bold text-gray-800">
                    Talk-A-Tive
                  </h1>
                </>
              )}
            </div>
            <div className="flex items-center justify-center gap-3">
              <div ref={notificationRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsNotificationOpen((prev) => !prev)}
                  className="p-1 hover:bg-gray-100 rounded-full relative"
                >
                  <Bell className="w-5 h-5 text-gray-500" />
                  {notifications.length > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                      {notifications.length}
                    </div>
                  )}
                </button>

                {isNotificationOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg text-sm z-20 max-h-80 overflow-y-auto">
                    <div className="p-3 border-b border-gray-100 font-semibold text-gray-700">
                      Notifications{" "}
                      {notifications.length > 0 && `(${notifications.length})`}
                    </div>
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-400 text-xs">
                        No new notifications
                      </div>
                    ) : (
                      notifications.map((notif) => {
                        const senderName = notif.sender?.name || "Someone";
                        return (
                          <div
                            key={notif._id}
                            onClick={() => {
                              handleChatClick(
                                (notif.chat?._id || notif.chat)?.toString(),
                              );
                              setIsNotificationOpen(false);
                            }}
                            className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-50 transition-colors"
                          >
                            <p className="font-medium text-gray-800 text-xs">
                              New message from {senderName}
                            </p>
                            <p className="text-gray-500 text-xs truncate mt-0.5">
                              {notif.isAudio
                                ? "🎤 Voice Message"
                                : notif.content}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              <div ref={profileMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                  className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 cursor-pointer rounded-full"
                >
                  <CircleUserRound className="text-gray-500" />
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg text-sm z-10">
                    <button
                      type="button"
                      className="w-full text-left px-4 py-2 hover:bg-gray-100"
                      onClick={handleProfileOpen}
                    >
                      My Profile
                    </button>
                    <button
                      type="button"
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-500"
                      onClick={() => setIsLogoutModalOpen(true)}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">{/*  */}</div>
          </div>

          {/* My Chats Section */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">My Chats</h2>
                <button
                  type="button"
                  onClick={() => setIsGroupModalOpen(true)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1 hover:bg-blue-600"
                >
                  <span>Create New Group</span>
                  <span className="text-lg">+</span>
                </button>
              </div>
            </div>

            {/* Chat List */}
            <div className="divide-y divide-gray-100">
              {loadingChats ? (
                <div className="flex justify-center p-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                filteredChats.map((chat: Chat) => {
                  const displayName = chat.isGroupChat
                    ? chat.chatName
                    : getSender(loggedUser, chat.users);
                  const lastMsg =
                    chat.latestMessage?.isAudio ||
                    chat.latestMessage?.content?.startsWith("data:audio")
                      ? "🎤 Voice Message"
                      : chat.latestMessage?.content || "No messages yet";

                  return (
                    <div
                      key={chat._id}
                      onClick={() => handleChatClick(chat._id)}
                      className={`p-4 cursor-pointer transition-colors ${
                        selectedChat === chat._id
                          ? "bg-blue-100"
                          : "bg-white hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-400 rounded-full flex items-center justify-center text-white font-semibold">
                          {displayName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-800 truncate">
                            {displayName}
                          </h3>
                          <p className="text-sm text-gray-500 truncate">
                            {lastMsg}
                          </p>
                        </div>
                        {notifications.filter(
                          (n) =>
                            (n.chat?._id || n.chat)?.toString() ===
                            chat._id.toString(),
                        ).length > 0 && (
                          <div className="bg-green-500 text-white text-[10px] font-bold min-w-[20px] h-5 rounded-full flex items-center justify-center px-1">
                            {
                              notifications.filter(
                                (n) =>
                                  (n.chat?._id || n.chat)?.toString() ===
                                  chat._id.toString(),
                              ).length
                            }
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Registered Users search results */}
            {isSearchOpen && (
              <div className="mt-4 border-t border-gray-200 pt-4 px-4">
                {loadingSearch ? (
                  <div className="flex justify-center p-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  </div>
                ) : filteredUsers.length ? (
                  <ul className="space-y-1">
                    {filteredUsers.map((user) => (
                      <li
                        key={user._id}
                        className="px-3 py-2 rounded-md hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleAccessChat(user._id)}
                      >
                        <p className="text-sm font-medium text-gray-800">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-gray-400">No users found</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Chat View */}
        <div className="flex-1 bg-white flex flex-col">
          {selectedChatData ? (
            <>
              {/* Chat Info Bar */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-800 flex gap-4 items-center">
                  <button
                    onClick={() => setSelectedChat(null)}
                    className="hover:bg-gray-200 p-1 rounded transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  {selectedChatData.isGroupChat
                    ? selectedChatData.chatName
                    : getSender(loggedUser, selectedChatData.users)}
                </h2>
                {selectedChatData.isGroupChat && (
                  <button
                    onClick={() => setIsGroupInfoOpen(true)}
                    title="View group members"
                    className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    <Eye className="w-5 h-5 text-gray-500" />
                  </button>
                )}
              </div>

              {/* Chat Messages Area */}
              <div
                className="flex-1 overflow-y-auto p-6 bg-white scrollbar-hide"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {/* Messages */}
                <div className="flex flex-col gap-6">
                  {loadingMessages ? (
                    <div className="flex justify-center p-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  ) : (
                    <>
                      {messages.map((msg: Message) => {
                        const isSystemMessage = !msg.sender;
                        const isMe = msg.sender?._id === loggedUser?._id;

                        if (isSystemMessage) {
                          return (
                            <div
                              key={msg._id}
                              className="flex justify-center my-2"
                            >
                              <div className="bg-gray-100 text-gray-500 text-[11px] px-3 py-1 rounded-full border border-gray-200 shadow-sm font-medium">
                                {msg.content}
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={msg._id}
                            className={`flex items-end gap-2 ${
                              isMe ? "justify-end" : "justify-start"
                            }`}
                          >
                            {!isMe && (
                              <div className="shrink-0 mb-1">
                                {msg.sender?.profilePic ||
                                msg.sender?.avatar ? (
                                  <img
                                    src={
                                      msg.sender.profilePic || msg.sender.avatar
                                    }
                                    alt={msg.sender.name}
                                    className="w-8 h-8 rounded-full border border-gray-200 object-cover"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600 border border-blue-200 capitalize">
                                    {msg.sender?.name?.charAt(0) || "U"}
                                  </div>
                                )}
                              </div>
                            )}

                            <div
                              className={`px-4 py-2 rounded-2xl max-w-[70%] shadow-sm ${
                                isMe
                                  ? "bg-blue-500 text-white rounded-br-none"
                                  : "bg-gray-100 text-gray-800 rounded-bl-none border border-gray-200"
                              }`}
                            >
                              <p
                                className={`text-[10px] font-bold mb-1 ${
                                  isMe ? "text-blue-100" : "text-blue-600"
                                }`}
                              >
                                {isMe ? "You" : msg.sender?.name || "User"}
                              </p>

                              {msg.isAudio ||
                              msg.content?.startsWith("data:audio") ? (
                                <div className="flex items-center gap-3 py-1 min-w-[200px]">
                                  <button
                                    onClick={() => {
                                      console.log(
                                        "CHAT: Play button clicked for message:",
                                        msg._id,
                                      );
                                      setActiveAudioId(
                                        activeAudioId === msg._id
                                          ? null
                                          : msg._id,
                                      );
                                    }}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                      isMe
                                        ? "bg-white/20 hover:bg-white/30"
                                        : "bg-blue-100 hover:bg-blue-200"
                                    }`}
                                  >
                                    {activeAudioId === msg._id ? (
                                      <Pause
                                        className={
                                          isMe
                                            ? "w-5 h-5 text-white"
                                            : "w-5 h-5 text-blue-600"
                                        }
                                      />
                                    ) : (
                                      <Play
                                        className={
                                          isMe
                                            ? "w-5 h-5 text-white fill-white"
                                            : "w-5 h-5 text-blue-600 fill-blue-600"
                                        }
                                      />
                                    )}
                                  </button>
                                  <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-1 h-6">
                                      {getWaveformHeights(msg._id).map(
                                        (h, i) => (
                                          <div
                                            key={i}
                                            className={`w-0.5 rounded-full transition-all ${
                                              isMe
                                                ? "bg-white/40"
                                                : "bg-blue-300"
                                            } ${activeAudioId === msg._id ? "animate-pulse" : ""}`}
                                            style={{
                                              height: `${h}%`,
                                            }}
                                          />
                                        ),
                                      )}
                                    </div>
                                    <div className="flex justify-between items-center text-[9px]">
                                      <span
                                        className={
                                          isMe
                                            ? "text-blue-100"
                                            : "text-gray-500"
                                        }
                                      >
                                        {msg.duration || "0:00"}
                                      </span>
                                      <Volume2
                                        className={
                                          isMe
                                            ? "w-3 h-3 text-blue-100"
                                            : "w-3 h-3 text-gray-400"
                                        }
                                      />
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm">{msg.content}</p>
                              )}

                              <p
                                className={`text-[10px] mt-1 text-right ${
                                  isMe ? "text-blue-100" : "text-gray-400"
                                }`}
                              >
                                {new Date(msg.createdAt).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                                {isMe && (
                                  <CheckCheck className="w-3.5 h-3.5 inline ml-1 opacity-80" />
                                )}
                              </p>
                            </div>

                            {isMe && (
                              <div className="shrink-0 mb-1">
                                {loggedUser?.profilePic ||
                                loggedUser?.avatar ? (
                                  <img
                                    src={
                                      loggedUser.profilePic || loggedUser.avatar
                                    }
                                    alt="me"
                                    className="w-8 h-8 rounded-full border border-blue-200 object-cover"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white shadow-inner capitalize">
                                    {loggedUser?.name?.charAt(0) || "Y"}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {isTyping ? (
                        <div className="flex justify-start">
                          <div className="bg-gray-100 px-4 py-2 rounded-lg text-gray-500 text-xs italic">
                            Typing...
                          </div>
                        </div>
                      ) : (
                        <></>
                      )}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 relative">
                <div className="flex gap-2 items-center" ref={emojiPickerRef}>
                  {/* Emoji Picker Popup */}
                  {showEmojiPicker && (
                    <div className="absolute bottom-16 left-0 z-50 shadow-2xl rounded-xl overflow-hidden">
                      <EmojiPicker
                        onEmojiClick={(emojiData: EmojiClickData) => {
                          setMessage((prev) => prev + emojiData.emoji);
                        }}
                        height={380}
                        width={320}
                        // Suggested behavior: close after pick or allow multiple?
                        // For now let's keep it open as is common in chat apps.
                      />
                    </div>
                  )}

                  {/* Emoji Button - Only show if not recording */}
                  {!isRecording && (
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker((prev) => !prev)}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center shrink-0"
                      title="Emoji"
                    >
                      <Smile className="w-6 h-6 text-gray-500 hover:text-blue-500 transition-colors" />
                    </button>
                  )}

                  {isRecording ? (
                    <div className="flex-1 flex items-center justify-between px-4 py-2 bg-red-50 border border-red-200 rounded-lg animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
                        <span className="text-red-600 font-medium text-sm">
                          Recording Voice Message...
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-red-400 text-xs font-mono">
                          {formatTime(recordingTime)}
                        </span>
                        <button
                          onClick={() => {
                            // Save duration BEFORE isRecording becomes false (which resets recordingTime to 0)
                            capturedDurationRef.current =
                              formatTime(recordingTime);
                            setIsRecording(false);
                            stopRecording();
                          }}
                          className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <Square className="w-4 h-4 fill-white" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        placeholder="Enter a message..."
                        value={message}
                        onChange={(e) => {
                          setMessage(e.target.value);

                          if (!socketConnected || !socketRef.current) return;

                          // If not already typing, emit event
                          if (!typingRef.current) {
                            typingRef.current = true;
                            socketRef.current.emit("typing", selectedChat);
                            console.log("SOCKET: Emitted 'typing'");
                          }

                          // Debounce 'stop typing'
                          if (typingTimeoutRef.current)
                            clearTimeout(typingTimeoutRef.current);

                          typingTimeoutRef.current = setTimeout(() => {
                            if (typingRef.current && socketRef.current) {
                              socketRef.current.emit(
                                "stop typing",
                                selectedChat,
                              );
                              typingRef.current = false;
                              console.log(
                                "SOCKET: Emitted 'stop typing' (debounced)",
                              );
                            }
                          }, 3000);
                        }}
                        onKeyPress={handleKeyPress}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsRecording(true);
                          startRecording();
                        }}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center shrink-0"
                        title="Record Voice"
                      >
                        <Mic className="w-6 h-6 text-gray-500 hover:text-red-500 transition-colors" />
                      </button>
                    </>
                  )}

                  <button
                    onClick={handleSendMessage}
                    disabled={!message.trim() && !isRecording}
                    className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    <SendHorizontal />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <svg
                  className="w-24 h-24 mx-auto mb-4 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <p className="text-xl">Select a chat to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <ProfileModal
        open={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      <NewGroupModal
        open={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onSuccess={getChats}
      />

      <GroupInfoModal
        open={isGroupInfoOpen}
        onClose={() => setIsGroupInfoOpen(false)}
        chat={selectedChatData ?? null}
        loggedUser={loggedUser}
        onUpdate={(updatedChat) => {
          const isStillMember = updatedChat.users.some(
            (u: User) => u._id === loggedUser?._id,
          );

          if (!isStillMember) {
            // Remove from my list
            setAllChats((prev) =>
              prev.filter((c) => c._id !== updatedChat._id),
            );
            if (selectedChat === updatedChat._id) {
              setSelectedChat(null);
            }
          } else {
            // Update the existing chat in my list
            setAllChats((prev) =>
              prev.map((c) => (c._id === updatedChat._id ? updatedChat : c)),
            );
          }
        }}
      />

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl p-6 w-[90%] max-w-sm">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Logout</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to logout?
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium border border-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await LogoutUser();
                    localStorage.removeItem("userInfo");
                    navigate("/");
                  } catch (error) {
                    console.error("Logout failed:", error);
                  } finally {
                    setIsLogoutModalOpen(false);
                    setIsProfileMenuOpen(false);
                  }
                }}
                className="px-4 py-2 bg-red-500 text-white hover:bg-red-600 rounded-lg transition-colors font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Chat;

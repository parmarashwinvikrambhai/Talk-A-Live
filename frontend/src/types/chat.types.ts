export interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  avatar?: string;
  profilePic?: string;
}

export interface Chat {
  _id: string;
  chatName: string;
  isGroupChat: boolean;
  users: User[];
  latestMessage?: Message;
  groupAdmin?: User;
}

export interface Message {
  _id: string;
  sender: User;
  content: string;
  chat: Chat;
  isAudio?: boolean;
  duration?: string;
  createdAt: string;
  updatedAt: string;
}

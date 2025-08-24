"use client";

import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Crown, Shield, Lock, Sparkles } from "lucide-react";
import { useAccount } from "wagmi";
import { formatDistanceToNow } from "date-fns";
import { useNotifications } from "@/components/ui/notification";

interface Message {
  id: string;
  content: string;
  author: {
    address: string;
    ens?: string;
    role: 'kaiju' | 'shadow' | 'visitor';
    avatar?: string;
  };
  timestamp: Date;
}

interface KaijuChatProps {
  kaijuId: string;
}

// Mock messages for demo
const generateMockMessages = (): Message[] => {
  return [
    {
      id: '1',
      content: "Welcome to my den, shadows! Big moves coming today 🚀",
      author: {
        address: '0x1234...5678',
        ens: 'dragonking.eth',
        role: 'kaiju',
        avatar: '/kaiju.png'
      },
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: '2',
      content: "Thanks for the PEPE call! Up 45% already",
      author: {
        address: '0xabcd...efgh',
        ens: 'shadow42.eth',
        role: 'shadow',
        avatar: '/shadow.png'
      },
      timestamp: new Date(Date.now() - 90 * 60 * 1000),
    },
    {
      id: '3',
      content: "Keep an eye on $WOJAK, accumulation phase ending",
      author: {
        address: '0x1234...5678',
        ens: 'dragonking.eth',
        role: 'kaiju',
        avatar: '/kaiju.png'
      },
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
    },
    {
      id: '4',
      content: "When are we rotating back to majors?",
      author: {
        address: '0x9876...5432',
        role: 'shadow',
      },
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
    },
    {
      id: '5',
      content: "Patience young shadow. The meme season has just begun.",
      author: {
        address: '0x1234...5678',
        ens: 'dragonking.eth',
        role: 'kaiju',
        avatar: '/kaiju.png'
      },
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
    },
  ];
};

export function KaijuChat({ kaijuId }: KaijuChatProps) {
  const { address, isConnected } = useAccount();
  const { showNotification } = useNotifications();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isShadow, setIsShadow] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load initial messages
    setMessages(generateMockMessages());
    
    // Check if user is a shadow
    // In production, check if user owns a shadow NFT for this kaiju
    setIsShadow(isConnected && Math.random() > 0.5);
  }, [kaijuId, isConnected]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !isConnected) return;

    if (!isShadow) {
      showNotification({
        type: "error",
        title: "Access Denied",
        message: "Only shadows can participate in the den chat",
      });
      return;
    }

    setIsLoading(true);
    
    // In production, send message via Supabase
    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      author: {
        address: address!,
        role: 'shadow',
      },
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
    setIsLoading(false);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'kaiju':
        return (
          <Badge variant="default" className="bg-red-900/50 text-red-400 gap-1">
            <Crown className="h-3 w-3" />
            Kaiju
          </Badge>
        );
      case 'shadow':
        return (
          <Badge variant="secondary" className="gap-1">
            <Shield className="h-3 w-3" />
            Shadow
          </Badge>
        );
      default:
        return null;
    }
  };

  if (!isConnected) {
    return (
      <Card className="bg-stone-800/50 p-8 text-center">
        <Lock className="h-12 w-12 text-stone-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Connect Wallet to View Chat</h3>
        <p className="text-stone-400">You need to connect your wallet to access the den chat</p>
      </Card>
    );
  }

  if (!isShadow) {
    return (
      <Card className="bg-stone-800/50 p-8 text-center">
        <Shield className="h-12 w-12 text-purple-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Shadows Only</h3>
        <p className="text-stone-400 mb-4">This chat is exclusive to shadow NFT holders</p>
        <Button className="bg-gradient-to-r from-purple-600 to-purple-700">
          <Sparkles className="h-4 w-4 mr-2" />
          Become a Shadow
        </Button>
      </Card>
    );
  }

  return (
    <div className="flex flex-col h-[600px]">
      {/* Chat Header */}
      <div className="bg-stone-800/50 p-4 rounded-t-lg border-b border-stone-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Den Private Chat</h3>
            <p className="text-sm text-stone-400">
              {messages.length} messages • {Math.floor(Math.random() * 20) + 5} shadows online
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            <Shield className="h-3 w-3 mr-1" />
            Shadow Access
          </Badge>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-900/50">
        {messages.map((message) => {
          const isKaiju = message.author.role === 'kaiju';
          const isOwnMessage = message.author.address === address;

          return (
            <div
              key={message.id}
              className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
            >
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={message.author.avatar} />
                <AvatarFallback>
                  {message.author.ens?.[0].toUpperCase() || message.author.address.slice(2, 4)}
                </AvatarFallback>
              </Avatar>

              <div className={`flex-1 ${isOwnMessage ? 'text-right' : ''}`}>
                <div className={`inline-block ${isOwnMessage ? 'text-right' : ''}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {!isOwnMessage && (
                      <>
                        <span className="text-sm font-medium">
                          {message.author.ens || `${message.author.address.slice(0, 6)}...${message.author.address.slice(-4)}`}
                        </span>
                        {getRoleBadge(message.author.role)}
                      </>
                    )}
                    <span className="text-xs text-stone-500">
                      {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                    </span>
                  </div>

                  <div
                    className={`inline-block px-4 py-2 rounded-lg ${
                      isOwnMessage
                        ? 'bg-purple-900/50 text-stone-200'
                        : isKaiju
                        ? 'bg-red-900/30 text-stone-200 border border-red-900/50'
                        : 'bg-stone-800 text-stone-200'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-stone-800/50 rounded-b-lg border-t border-stone-700">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex gap-2"
        >
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-stone-900/50 border-stone-700"
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={!newMessage.trim() || isLoading}
            className="bg-gradient-to-r from-purple-600 to-purple-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
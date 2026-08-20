'use client';

import React, { useState, useEffect, useRef } from 'react';
import { encryptData, decryptData } from '@/lib/crypto';
import { 
  Send, Shield, ShieldAlert, Loader2, ArrowLeft,
  Users, MessageSquare, Clock, User
} from 'lucide-react';
import Link from 'next/link';
import { Toast, ToastType } from '@/components/Toast';

interface ChatPanelProps {
  id: string;
}

interface Message {
  sender: string;
  text: string;
  timestamp: number;
}

export default function ChatPanel({ id }: ChatPanelProps) {
  const [nickname, setNickname] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);

  const [chatKey, setChatKey] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Extract encryption key from URL hash fragment
    const hash = window.location.hash;
    const key = hash ? hash.substring(1) : '';
    setChatKey(key);

    if (!key) {
      setErrorMsg('No secure decryption key found in the URL. Ensure you have the complete link.');
      setIsLoading(false);
      return;
    }

    // Load initial thread data
    const fetchThread = async () => {
      try {
        const response = await fetch(`/api/threads/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('This E2E chat thread has expired or does not exist.');
          }
          throw new Error('Failed to retrieve chat thread.');
        }

        const data = await response.json();
        setExpiresAt(data.expires_at);

        // Decrypt messages
        const parsed = JSON.parse(data.messages_json);
        if (parsed.ciphertext && parsed.iv) {
          const decryptedString = await decryptData(parsed.ciphertext, parsed.iv, key);
          const decryptedMessages = JSON.parse(decryptedString) as Message[];
          setMessages(decryptedMessages);
        }
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || 'An error occurred.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchThread();

    // Start polling every 2 seconds
    pollingRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/threads/${id}`);
        if (!response.ok) return;

        const data = await response.json();
        const parsed = JSON.parse(data.messages_json);
        if (parsed.ciphertext && parsed.iv) {
          const decryptedString = await decryptData(parsed.ciphertext, parsed.iv, key);
          const decryptedMessages = JSON.parse(decryptedString) as Message[];
          
          // Only update state if message counts differ or timestamps differ
          setMessages((prev) => {
            if (prev.length !== decryptedMessages.length || 
                (prev.length > 0 && prev[prev.length - 1].timestamp !== decryptedMessages[decryptedMessages.length - 1].timestamp)) {
              return decryptedMessages;
            }
            return prev;
          });
        }
      } catch (e) {
        console.error('Polling decryption error', e);
      }
    }, 2000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isJoined]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;
    setIsJoined(true);
    setToast({ message: `Joined as @${nickname}`, type: 'success' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    setIsSending(true);
    const textToSend = inputText.trim();
    setInputText('');

    try {
      const newMessage: Message = {
        sender: nickname,
        text: textToSend,
        timestamp: Date.now(),
      };

      // Append new message locally
      const updatedMessages = [...messages, newMessage];

      // Encrypt the complete messages list client-side
      const { ciphertext, iv } = await encryptData(
        JSON.stringify(updatedMessages),
        chatKey
      );

      // Push encrypted package to the server via PUT
      const response = await fetch(`/api/threads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages_json: JSON.stringify({ ciphertext, iv }),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to deliver encrypted message.');
      }

      setMessages(updatedMessages);
    } catch (err: any) {
      console.error(err);
      setToast({ message: err.message || 'Error sending message.', type: 'error' });
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-violet-500 mx-auto" />
        <p className="text-text-muted text-sm font-semibold">Decrypting thread channel...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="max-w-md mx-auto py-12 px-6 glass-panel rounded-2xl border-rose-500/20 bg-rose-500/5 text-center space-y-6">
        <div className="w-14 h-14 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto border border-rose-500/20">
          <ShieldAlert className="w-7 h-7 text-rose-400 animate-pulse" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-text-main">Chat Channel Expired</h3>
          <p className="text-xs text-text-muted leading-relaxed">{errorMsg}</p>
        </div>
        <Link
          href="/"
          className="inline-block btn-gradient font-bold px-6 py-3 rounded-xl text-xs shadow-md transition-all cursor-pointer"
        >
          Return to Creator
        </Link>
      </div>
    );
  }

  // Nickname entry screen before joining chat
  if (!isJoined) {
    return (
      <div className="max-w-md mx-auto py-12 px-6 glass-panel rounded-2xl border-panel-border bg-btn-sec-bg/5 text-center space-y-6">
        <div className="w-14 h-14 rounded-full bg-violet-500/10 flex items-center justify-center mx-auto border border-violet-500/20">
          <Users className="w-6 h-6 text-violet-400" />
        </div>

        <div className="space-y-1.5 text-center">
          <h3 className="text-lg font-bold text-text-main">Join E2E Chat Thread</h3>
          <p className="text-xs text-text-muted">
            This chat is completely encrypted client-side. The server has no knowledge of nicknames or contents.
          </p>
        </div>

        <form onSubmit={handleJoin} className="space-y-4">
          <input
            type="text"
            placeholder="Choose a nickname..."
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full glass-input rounded-xl px-4 py-3 text-sm"
            maxLength={15}
            required
            autoFocus
          />

          <button
            type="submit"
            className="w-full btn-gradient font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <User className="w-4 h-4" />
            Enter Secure Chat Room
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[75vh] glass-panel rounded-2xl overflow-hidden">
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Header bar */}
      <div className="bg-btn-sec-bg px-6 py-4 border-b border-panel-border flex items-center justify-between">
        <div className="flex items-center gap-3 text-left">
          <div className="w-9 h-9 rounded-lg bg-teal-500/10 flex items-center justify-center border border-teal-500/20">
            <MessageSquare className="w-5 h-5 text-teal-400" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-sm font-bold text-text-main flex items-center gap-1.5">
              Secure Ephemeral Thread
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            </h3>
            <span className="text-[10px] text-text-ghost uppercase font-semibold">
              E2E Decrypted (Zero-Knowledge)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-text-muted">
          <Clock className="w-4 h-4 text-violet-400" />
          <span>
            Expires: {expiresAt ? new Date(expiresAt).toLocaleTimeString() : 'Never'}
          </span>
        </div>
      </div>

      {/* Messages list */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-background/5">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
            <Shield className="w-12 h-12 text-text-ghost animate-pulse" />
            <p className="text-xs font-semibold text-text-muted">This E2E encrypted room is empty.</p>
            <p className="text-[10px] text-text-ghost">Send a message to initiate the conversation.</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.sender === nickname;
            return (
              <div
                key={index}
                className={`flex flex-col max-w-[70%] text-left ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
              >
                <span className="text-[10px] font-bold text-text-ghost mb-1 px-1">
                  {isMe ? 'You' : `@${msg.sender}`}
                </span>
                
                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    isMe
                      ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white rounded-tr-none'
                      : 'bg-btn-sec-bg border border-panel-border text-text-main rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
                
                <span className="text-[9px] text-text-ghost mt-0.5 px-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Message input bar */}
      <form
        onSubmit={handleSendMessage}
        className="p-4 border-t border-panel-border bg-btn-sec-bg/20 flex gap-3"
      >
        <input
          type="text"
          placeholder="Type a secure message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 glass-input rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-violet-500"
          required
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          className="btn-gradient p-3.5 rounded-xl flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

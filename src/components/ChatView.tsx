import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  ClipboardCopy,
  Smile,
  Shield,
  Clock,
  CheckCheck,
  QrCode,
  Sparkles
} from 'lucide-react';
import type { Message, ConnectionState } from '../types/linkpair';

interface ChatViewProps {
  messages: Message[];
  onSendMessage: (text: string, type?: 'text' | 'clipboard') => void;
  connectionState: ConnectionState;
  onOpenPairing: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  onSendMessage,
  connectionState,
  onOpenPairing
}) => {
  const [inputText, setInputText] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const isConnected = connectionState === 'connected';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim(), 'text');
    setInputText('');
    setShowEmojis(false);
  };

  const handleSendClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        onSendMessage(text, 'clipboard');
      }
    } catch {
      // Fallback
      if (inputText) {
        onSendMessage(inputText, 'clipboard');
        setInputText('');
      }
    }
  };

  const emojis = ['👍', '🔒', '🚀', '📱', '⚡', '✨', '🔥', '🎉', '📁', '🤝'];

  return (
    <div className="flex flex-col h-full bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
      {/* Top Banner if not connected */}
      {!isConnected && (
        <div className="bg-gradient-to-r from-cyan-950/80 via-slate-900 to-blue-950/80 border-b border-cyan-800/40 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-3 text-left">
            <div className="p-2 rounded-xl bg-cyan-900/40 text-cyan-400 border border-cyan-700/50">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Noch kein Gerät gekoppelt</h4>
              <p className="text-xs text-slate-300">
                Verbinden Sie Ihr Smartphone oder Zweitgerät per QR-Code für direkten P2P-Austausch.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenPairing}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium text-xs hover:from-cyan-400 hover:to-blue-500 transition shadow-md whitespace-nowrap"
          >
            <QrCode className="w-4 h-4" />
            <span>Jetzt koppeln</span>
          </button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-cyan-400 shadow-inner">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">Ende-zu-Ende verschlüsselter P2P Chat</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Nachrichten werden direkt über WebRTC RTCDataChannel von Gerät zu Gerät übertragen. Kein Server speichert Ihre Konversation.
              </p>
            </div>
            <div className="flex items-center space-x-2 text-[11px] text-cyan-400/90 bg-cyan-950/40 px-3 py-1.5 rounded-full border border-cyan-800/40">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Zero-Cloud P2P Architektur</span>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender === 'me';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in fade-in duration-150`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-md relative group ${
                    isMe
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-sm'
                      : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-bl-sm'
                  } ${msg.type === 'clipboard' ? 'border-2 border-amber-400/40' : ''}`}
                >
                  {msg.type === 'clipboard' && (
                    <div className="flex items-center space-x-1 text-[10px] font-semibold text-amber-300 mb-1">
                      <ClipboardCopy className="w-3 h-3" />
                      <span>Zwischenablage synchronisiert</span>
                    </div>
                  )}

                  <p className="text-sm whitespace-pre-wrap break-words leading-relaxed select-text">
                    {msg.text}
                  </p>

                  <div
                    className={`flex items-center justify-end space-x-1.5 mt-1 text-[10px] ${
                      isMe ? 'text-cyan-200/80' : 'text-slate-400'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {isMe && <CheckCheck className="w-3 h-3 text-cyan-200" />}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Toolbar */}
      <div className="p-3 md:p-4 border-t border-slate-800 bg-slate-950/60 relative">
        {showEmojis && (
          <div className="absolute bottom-full mb-2 left-4 bg-slate-800 border border-slate-700 rounded-2xl p-2 shadow-xl flex flex-wrap gap-1 max-w-xs animate-in zoom-in-95 duration-100 z-10">
            {emojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  setInputText((prev) => prev + emoji);
                  setShowEmojis(false);
                }}
                className="w-8 h-8 rounded-lg hover:bg-slate-700 flex items-center justify-center text-lg transition"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSend} className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowEmojis(!showEmojis)}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
            title="Emoji hinzufügen"
          >
            <Smile className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={handleSendClipboard}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 transition"
            title="Zwischenablage senden"
          >
            <ClipboardCopy className="w-5 h-5" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isConnected ? 'Nachricht tippen...' : 'Nachricht schreiben (Sendet nach Kopplung)...'
            }
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition"
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white disabled:opacity-40 transition shadow-md"
            title="Nachricht senden"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

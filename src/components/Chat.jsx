import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import useGameStore from '../store/gameStore';
import { sendMessage } from '../services/socket';

export default function Chat() {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const { messages, playerId, drawerId, gamePhase } = useGameStore();

  const isDrawer = playerId === drawerId;
  const canGuess = gamePhase === 'drawing' && !isDrawer;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (canGuess) {
      sendMessage('guess', { text: input.trim() });
    } else {
      sendMessage('chat', { text: input.trim() });
    }
    setInput('');
  };

  const getMessageStyle = (msg) => {
    switch (msg.type) {
      case 'system':
        return 'text-gray-500 italic text-sm bg-gray-50';
      case 'correct':
        return 'text-success font-semibold bg-success/10';
      case 'close':
        return 'text-warning font-semibold bg-warning/10';
      case 'error':
        return 'text-danger bg-danger/10';
      default:
        return 'text-gray-700';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg flex flex-col" style={{ height: 'calc(60vh + 80px)' }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="font-bold text-gray-700">
          {canGuess ? '💬 Guess the word!' : '💬 Chat'}
        </h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`px-3 py-1.5 rounded-lg text-sm ${getMessageStyle(msg)}`}
          >
            {msg.type === 'system' || msg.type === 'correct' || msg.type === 'close' || msg.type === 'error' ? (
              <span>{msg.text}</span>
            ) : (
              <>
                <span className="font-semibold text-primary">{msg.playerName}: </span>
                <span>{msg.text}</span>
              </>
            )}
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isDrawer && gamePhase === 'drawing'
                ? "You're drawing! You can chat."
                : canGuess
                ? 'Type your guess...'
                : 'Type a message...'
            }
            maxLength={100}
            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none
                       focus:border-primary text-sm"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="px-4 py-2 bg-primary text-white rounded-xl font-semibold text-sm
                       hover:bg-primary-dark transition-colors"
          >
            Send
          </motion.button>
        </div>
      </form>
    </div>
  );
}
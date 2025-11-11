
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { sendChatMessage } from '../services/geminiService';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';

const CHAT_HISTORY_STORAGE_KEY = 'geminiFunFactoryChatHistory';

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history from localStorage on component mount
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
      if (storedHistory) {
        setMessages(JSON.parse(storedHistory));
      } else {
        // Optional: Add an initial welcome message if no history exists
        // setMessages([{ role: 'model', content: "Hi there! I'm Gemini, your friendly chat assistant. What can I help you with today?" }]);
      }
    } catch (e) {
      console.error("Failed to load chat history from localStorage", e);
    }
  }, []); // Empty dependency array means this runs only once on mount

  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    try {
      if (messages.length > 0) { // Only save if there are messages
        localStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(messages));
      } else {
        localStorage.removeItem(CHAT_HISTORY_STORAGE_KEY); // Clear if no messages
      }
    } catch (e) {
      console.error("Failed to save chat history to localStorage", e);
    }
  }, [messages]);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!inputMessage.trim()) return;

    const newUserMessage: ChatMessage = { role: 'user', content: inputMessage };
    // Optimistically update messages with user's input
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      // Pass the *updated* message history to the service function
      const response = await sendChatMessage([...messages, newUserMessage], inputMessage);
      const newModelMessage: ChatMessage = { role: 'model', content: response };
      setMessages((prevMessages) => [...prevMessages, newModelMessage]);
    } catch (err) {
      console.error('Error sending message:', err);
      setError(`Failed to get response: ${(err as Error).message}`);
      // If there's an error, you might want to remove the user's message
      // or mark it as failed, but for simplicity, we'll just show an error.
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center p-4 h-full w-full max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-700 mb-6 text-center">Chat with Gemini!</h2>

      <div className="flex-grow w-full bg-white p-4 rounded-xl shadow-lg mb-4 overflow-y-auto max-h-[60vh] custom-scrollbar">
        {messages.length === 0 && !loading ? (
          <div className="text-center text-gray-500 italic py-8">
            Start a conversation! Ask me anything.
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`flex mb-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] p-3 rounded-lg shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-blue-500 text-white rounded-br-none'
                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
                }`}
                role="status" // Added for accessibility
                aria-live="polite" // Announce changes to screen readers
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
        {loading && <LoadingSpinner />}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative w-full max-w-3xl mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="bg-white p-4 rounded-xl shadow-lg w-full max-w-3xl flex space-x-2">
        <input
          type="text"
          className="flex-grow shadow appearance-none border rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type your message here..."
          disabled={loading}
          aria-label="Chat message input" // Added for accessibility
        />
        <Button type="submit" disabled={loading}>
          Send
        </Button>
      </form>
    </div>
  );
};

export default Chatbot;
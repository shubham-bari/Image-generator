import React, { useState, useRef, useEffect } from 'react';
import './ImageGenerator.css';

const ImageGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleClearChat = () => {
    setMessages([]);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    // Add user message
    const userMessage = { type: 'user', content: prompt };
    setMessages(prev => [...prev, userMessage]);
    setPrompt('');
    setLoading(true);
    setError('');

    try {
      const apiKey = "sk-ShkVk6orfv56fElWjtuuUrEVghoz3K0QDwgWOaJ6CkSQkHd3"; 
      if (!apiKey) {
        throw new Error('API key is missing. Please check your .env file.');
      }

      const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          text_prompts: [
            {
              text: prompt,
              weight: 1
            }
          ],
          cfg_scale: 7,
          height: 1024,
          width: 1024,
          steps: 30,
          samples: 1,
          style_preset: "photographic"
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const imageBase64 = data.artifacts[0].base64;
      const imageUrl = `data:image/png;base64,${imageBase64}`;
      
      // Add bot response with image
      const botMessage = { type: 'bot', content: imageUrl };
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error('Error details:', err);
      setError(`Error generating image: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h1>STABLE DIFFUSION Text to Image</h1>
      </div>
      
      <div className="messages-container">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.type}`}>
            {message.type === 'user' ? (
              <div className="message-content">
                <p>{message.content}</p>
              </div>
            ) : (
              <div className="message-content">
                <img src={message.content} alt="Generated from Stable Diffusion" className="generated-image" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="message bot">
            <div className="message-content">
              <div className="loading-dots">Generating image<span>.</span><span>.</span><span>.</span></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="chat-input-form">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the image you want to generate..."
          className="chat-input"
          disabled={loading}
        />
        <div className="button-group">
          <button type="submit" disabled={loading} className="send-button">
            Send
          </button>
          <button 
            onClick={handleClearChat} 
            className="clear-chat-button"
            disabled={loading || messages.length === 0}
            type="button"
          >
            Clear
          </button>
        </div>
      </form>

      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default ImageGenerator; 
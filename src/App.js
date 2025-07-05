import { useState } from "react";

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  const sessionId = "user-session-" + Date.now();
  const webhookURL = "https://n8n-workflow-index.vercel.app/api/chat";
  
  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    
    try {
      const res = await fetch(webhookURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          chatInput: input,
        }),
      });
      
      const data = await res.json();
      console.log('Received data:', data); // Debug log
      
      // Extract the actual message content from the response
      let botText;
      if (data.output) {
        botText = data.output;
      } else if (data.text) {
        botText = data.text;
      } else if (data.response) {
        botText = data.response;
      } else if (typeof data === 'string') {
        botText = data;
      } else {
        botText = "I couldn't process that request. Please try again.";
      }
      
      console.log('Extracted botText:', botText); // Debug log
      
      // Check if botText itself contains JSON structure
      if (typeof botText === 'string' && botText.includes('"output":')) {
        // Try to parse the nested JSON
        try {
          const nestedData = JSON.parse(botText);
          if (nestedData.output) {
            botText = nestedData.output;
          }
        } catch (e) {
          // If parsing fails, clean it manually
          botText = botText
            .replace(/^\s*\{\s*"output":\s*"/, '')
            .replace(/"\s*\}\s*$/, '')
            .replace(/\\n/g, '\n')
            .replace(/\\"/g, '"');
        }
      }
      
      // Final cleanup
      botText = botText
        .replace(/^\s*\{\s*"output":\s*"/, '')
        .replace(/"\s*\}\s*$/, '')
        .replace(/^"/, '')
        .replace(/"$/, '')
        .trim();
      
      const aiReply = {
        sender: "bot",
        text: botText
      };
      setMessages((prev) => [...prev, aiReply]);
    } catch (err) {
      setMessages((prev) => [...prev, { 
        sender: "bot", 
        text: "Error contacting the workflow assistant. Please check your connection and try again." 
      }]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Function to render text with basic markdown-like formatting
  const renderMessage = (text) => {
    // Replace markdown-style formatting with HTML
    const formattedText = text
      .replace(/### (.*?)(\n|$)/g, '<h3 class="font-bold text-lg mb-2">$1</h3>')
      .replace(/## (.*?)(\n|$)/g, '<h2 class="font-bold text-xl mb-2">$1</h2>')
      .replace(/# (.*?)(\n|$)/g, '<h1 class="font-bold text-2xl mb-2">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
    
    return <div dangerouslySetInnerHTML={{ __html: formattedText }} />;
  };
  
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto bg-white shadow-xl rounded-xl flex flex-col h-[80vh]">
        <div className="bg-black text-white p-4 rounded-t-xl">
          <h2 className="text-xl font-bold">🤖 n8n Workflow Assistant</h2>
          <p className="text-sm opacity-80">Find the perfect workflow for your automation needs</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-8">
              <p className="text-lg mb-2">Welcome! I'm your assistant for building smarter workflows.</p>
              <p className="text-sm">Just tell me your ideas!</p>
            </div>
          )}
          
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] p-3 rounded-lg ${
                  msg.sender === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-800"
                }`}
              >
                {msg.sender === "bot" ? renderMessage(msg.text) : msg.text}
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-200 text-gray-800 p-3 rounded-lg">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t">
          <div className="flex space-x-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me about workflows..."
              rows={1}
              className="flex-1 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{minHeight: '48px', maxHeight: '120px'}}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

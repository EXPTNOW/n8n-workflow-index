import { useState } from "react";

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  const sessionId = "user-session-" + Date.now();
  const webhookURL = "https://expandingtogether.app.n8n.cloud/webhook/e695e382-99dc-4925-b500-354a4275ffd2";
  
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
      
      // Check if botText itself contains JSON structure
      if (typeof botText === 'string' && botText.includes('"output":')) {
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

  // Function to render text with better markdown formatting
  const renderMessage = (text) => {
    // Clean up and format the text
    const formattedText = text
      // Convert headers
      .replace(/### (.*?)(\n|$)/g, '<h3 class="font-bold text-lg mb-2 mt-3">$1</h3>')
      .replace(/## (.*?)(\n|$)/g, '<h2 class="font-bold text-xl mb-2 mt-4">$1</h2>')
      .replace(/# (.*?)(\n|$)/g, '<h1 class="font-bold text-2xl mb-2 mt-4">$1</h1>')
      
      // Clean up bullet points - remove ALL * and - symbols
      .replace(/^\s*[\*\-\+]\s*/gm, '• ')
      .replace(/\*\s+/g, '• ')  // Also catch standalone asterisks with spaces
      
      // Convert numbered lists
      .replace(/^\s*\d+\.\s*/gm, '')
      
      // Convert bold and italic (but not the asterisks used for bullets)
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>')
      
      // Convert line breaks
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>')
      
      // Clean up any remaining formatting symbols
      .replace(/🔹/g, '')
      .replace(/\*\*:/g, ':')
      .replace(/\*\*\./g, '.')
      .replace(/\s*\*\s*/g, ' ')  // Remove any remaining asterisks with spaces, '')
      .replace(/\*\*:/g, ':')
      .replace(/\*\*\./g, '.')
      
      // Format sections better
      .replace(/^(\s*•\s*.+?):/gm, '<strong>$1:</strong>')
      .replace(/(\w+):\s*$/gm, '<strong class="block mt-3 mb-1">$1:</strong>');
    
    return <div dangerouslySetInnerHTML={{ __html: formattedText }} className="leading-relaxed break-words" style={{ wordWrap: 'break-word', wordBreak: 'break-word', overflowWrap: 'break-word' }} />;
  };
  
  return (
    <div className="min-h-screen bg-gray-100 p-2 sm:p-4">
      <div className="max-w-2xl mx-auto bg-white shadow-xl rounded-xl flex flex-col h-[90vh] sm:h-[80vh]">
        <div className="bg-black text-white p-3 sm:p-4 rounded-t-xl">
          <h2 className="text-lg sm:text-xl font-bold">🤖 n8n Workflow Assistant</h2>
          <p className="text-xs sm:text-sm opacity-80">Find the perfect workflow for your automation needs</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-8">
              <p className="text-base sm:text-lg mb-2">Welcome! I'm your assistant for building smarter workflows.</p>
              <p className="text-xs sm:text-sm">Just tell me your ideas!</p>
            </div>
          )}
          
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[70%] p-3 rounded-lg break-words ${
                  msg.sender === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-800"
                }`}
                style={{ 
                  wordWrap: 'break-word', 
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word'
                }}
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
        
        <div className="p-3 sm:p-4 border-t">
          <div className="flex space-x-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me about workflows..."
              rows={1}
              className="flex-1 p-2 sm:p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              style={{minHeight: '40px', maxHeight: '120px'}}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="bg-blue-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

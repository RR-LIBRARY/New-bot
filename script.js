// --- START OF MODIFIED script.js CODE ---

const chatOutput = document.getElementById('chat-output');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const statusArea = document.getElementById('status-area');

// --- !!! Backend ka sahi URL (Render wala) yahaan daalein !!! ---
const backendUrl = 'https://deepseek-66bq.onrender.com/api/chat'; // <<<<<===== YEH LINE UPDATE KI GAYI HAI =====<<<<<

function addMessage(text, sender) {
    if (!chatOutput) { console.error("Error: chatOutput element not found!"); return; }
    const messageElement = document.createElement('p');
    messageElement.textContent = text;
    messageElement.className = sender === 'user' ? 'user-message' : (sender === 'error' ? 'error-message' : 'bot-message');
    chatOutput.appendChild(messageElement);
    chatOutput.scrollTop = chatOutput.scrollHeight;
    return messageElement;
}

async function sendMessage() {
     if (!userInput || !sendButton || !statusArea || !chatOutput) {
         console.error("Error: Essential HTML elements not found!");
         addMessage("त्रुटि: पेज लोड होने में समस्या।", "error");
         return;
     }
    const userText = userInput.value.trim();
    if (!userText) return;
    addMessage(userText, 'user');
    userInput.value = '';
    sendButton.disabled = true;
    userInput.disabled = true;
    statusArea.textContent = 'बॉट सोच रहा है...';
    let botMessageElement = addMessage('...', 'bot');
    if (!botMessageElement) {
        console.error("Error: Could not create bot message element.");
        statusArea.textContent = 'त्रुटि: संदेश दिखाने में समस्या।';
        sendButton.disabled = false; userInput.disabled = false; return;
    }
    let accumulatedResponse = '';
    try {
        // Ab Replit URL check karne ki zaroorat nahi, use comment kar dete hain ya hata dete hain.
        // if (!backendUrl || !(backendUrl.includes('replit.dev') || ...)) { ... }

        const response = await fetch(backendUrl, { // Ab yeh sahi Render URL use karega
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userText }),
        });
        if (!response.ok) {
            const errorText = await response.text(); // Error text ko padhne ki koshish karein
            throw new Error(`API Error ${response.status}: ${errorText || response.statusText}`);
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let firstChunk = true;
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            accumulatedResponse += chunk;
            // Bot message ko update karte rahein
            if (botMessageElement) {
               if (firstChunk && chunk.trim()) {
                   botMessageElement.textContent = chunk; // Pehla chunk seedha display karein
                   firstChunk = false;
               } else {
                   botMessageElement.textContent += chunk; // Baaki chunks ko jodte jaayein
               }
            }
            if (chatOutput) chatOutput.scrollTop = chatOutput.scrollHeight; // Scroll to bottom
        }
    } catch (error) {
        console.error('Error sending message or receiving stream:', error);
        if (botMessageElement) {
           botMessageElement.textContent = `त्रुटि: ${error.message}`; // Error ko UI mein dikhayein
           botMessageElement.className = 'error-message';
        } else {
            addMessage(`त्रुटि: ${error.message}`, 'error');
        }
    } finally {
        // Reset UI state
        if(sendButton) sendButton.disabled = false;
        if(userInput) userInput.disabled = false;
        if(statusArea) statusArea.textContent = '';
        if(userInput) userInput.focus();
    }
}

// --- Event Listeners ---
if (sendButton) {
    sendButton.addEventListener('click', sendMessage);
} else { console.error("Error: Send button not found!"); }

if (userInput) {
    userInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    });
    userInput.focus();
} else { console.error("Error: User input not found!"); }

// --- END OF MODIFIED script.js CODE ---

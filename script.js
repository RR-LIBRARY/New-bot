// --- START OF FINAL script.js CODE (with YOUR new URL) ---

const chatOutput = document.getElementById('chat-output');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const statusArea = document.getElementById('status-area');

// --- !!! यहाँ आपका नया Replit URL डाला गया है !!! ---
const backendUrl = 'https://855d36bc-6914-48b9-95d9-6d896d82dba3-00-fh5p4j0k62xl.sisko.replit.dev/api/chat'; // <<<<<===== यह लाइन आपके नए URL से अपडेट हो गई है =====<<<<<

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
         console.error("Error: One or more essential HTML elements not found!");
         addMessage("त्रुटि: पेज लोड होने में समस्या है। कृपया रीफ़्रेश करें।", "error");
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
        if (!backendUrl || !(backendUrl.includes('replit.dev') || backendUrl.includes('repl.co') || backendUrl.includes('repl.run'))) {
             console.warn('Backend URL ठीक नहीं लग रहा है या सेट नहीं है: ', backendUrl);
             // आप यहाँ एरर फेंक सकते हैं अगर URL सेट न हो
             if (!backendUrl || backendUrl.startsWith('PASTE_YOUR_NEW_REPLIT_URL_HERE')) { // यह जांच अब शायद उतनी ज़रूरी नहीं
                 throw new Error('Backend URL को script.js में सेट करना आवश्यक है!');
             }
        }
        const response = await fetch(backendUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userText }),
        });
        if (!response.ok) {
            const errorText = await response.text();
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
            if (firstChunk && chunk.trim()) {
                botMessageElement.textContent = chunk;
                firstChunk = false;
            } else {
                botMessageElement.textContent += chunk;
            }
            if (chatOutput) chatOutput.scrollTop = chatOutput.scrollHeight;
        }
    } catch (error) {
        console.error('संदेश भेजने या स्ट्रीम प्राप्त करने में त्रुटि:', error);
        if (botMessageElement) {
           botMessageElement.textContent = `त्रुटि: ${error.message}`;
           botMessageElement.className = 'error-message';
        } else {
            addMessage(`त्रुटि: ${error.message}`, 'error');
        }
    } finally {
        if(sendButton) sendButton.disabled = false;
        if(userInput) userInput.disabled = false;
        if(statusArea) statusArea.textContent = '';
        if(userInput) userInput.focus();
    }
}

// --- इवेंट्स सेट करें ---
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

// --- END OF FINAL script.js CODE ---
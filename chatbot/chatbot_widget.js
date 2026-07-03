// Chatbot widget JavaScript - integráció az API-val

class KlimaprofiChatbot {
    constructor(apiUrl) {
        this.apiUrl = apiUrl || 'http://localhost:5000'; // Railway URL-t behelyettesítsd
        this.conversationHistory = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.addSystemMessage("Szia! 👋 Én vagyok a KlímaProfi AI asszisztens. Szívesen segítselek a klímákkal kapcsolatban. Milyen kérdésed van?");
    }

    setupEventListeners() {
        const sendBtn = document.getElementById('chatbot-send');
        const inputField = document.getElementById('chatbot-input');
        const toggleBtn = document.getElementById('chatbot-toggle');
        const closeBtn = document.getElementById('chatbot-close');
        const chatWindow = document.getElementById('chatbot-window');

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                chatWindow.style.display = chatWindow.style.display === 'none' ? 'flex' : 'none';
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                chatWindow.style.display = 'none';
            });
        }

        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }

        if (inputField) {
            inputField.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.sendMessage();
            });
        }
    }

    async sendMessage() {
        const inputField = document.getElementById('chatbot-input');
        const messagesDiv = document.getElementById('chatbot-messages');
        const message = inputField.value.trim();

        if (!message) return;

        // User message display
        this.addUserMessage(message);
        inputField.value = '';

        // Show typing indicator
        this.addTypingIndicator();

        try {
            // API call
            const response = await fetch(`${this.apiUrl}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.statusText}`);
            }

            const data = await response.json();

            // Remove typing indicator
            this.removeTypingIndicator();

            if (data.success) {
                this.addBotMessage(data.response);
            } else {
                this.addBotMessage(`❌ Hiba: ${data.error}`);
            }
        } catch (error) {
            console.error('Chatbot error:', error);
            this.removeTypingIndicator();
            this.addBotMessage(`⚠️ Sajnos hiba történt. Kérlek próbálkozz később vagy hívj bennünket: +36 1 234 5678`);
        }
    }

    addUserMessage(text) {
        const messagesDiv = document.getElementById('chatbot-messages');
        const msgDiv = document.createElement('div');
        msgDiv.style.cssText = 'margin-bottom: 0.8rem; text-align: right;';
        msgDiv.innerHTML = `<p style="background: #0099ff; color: white; padding: 0.7rem; border-radius: 8px; display: inline-block; max-width: 80%; word-wrap: break-word;">${this.escapeHtml(text)}</p>`;
        messagesDiv.appendChild(msgDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        this.conversationHistory.push({ role: 'user', content: text });
    }

    addBotMessage(text) {
        const messagesDiv = document.getElementById('chatbot-messages');
        const msgDiv = document.createElement('div');
        msgDiv.style.cssText = 'margin-bottom: 0.8rem;';
        msgDiv.innerHTML = `<p style="background: #f0f0f0; padding: 0.7rem; border-radius: 8px; display: inline-block; max-width: 80%; word-wrap: break-word;">${text}</p>`;
        messagesDiv.appendChild(msgDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        this.conversationHistory.push({ role: 'bot', content: text });
    }

    addSystemMessage(text) {
        const messagesDiv = document.getElementById('chatbot-messages');
        const msgDiv = document.createElement('div');
        msgDiv.style.cssText = 'margin-bottom: 0.8rem; text-align: center;';
        msgDiv.innerHTML = `<p style="background: #e8f4f8; color: #0099ff; padding: 0.7rem; border-radius: 8px; display: inline-block; font-size: 0.9rem;">${text}</p>`;
        messagesDiv.appendChild(msgDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    addTypingIndicator() {
        const messagesDiv = document.getElementById('chatbot-messages');
        const msgDiv = document.createElement('div');
        msgDiv.id = 'typing-indicator';
        msgDiv.style.cssText = 'margin-bottom: 0.8rem;';
        msgDiv.innerHTML = `<p style="background: #f0f0f0; padding: 0.7rem; border-radius: 8px; display: inline-block;">⏳ Gondolkodok...</p>`;
        messagesDiv.appendChild(msgDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    removeTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Módosítsd az URL-t a Railway deploy után
    const apiUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:5000' 
        : 'https://your-railway-app.up.railway.app'; // IDE kerül a Railway URL
    
    window.chatbot = new KlimaprofiChatbot(apiUrl);
});

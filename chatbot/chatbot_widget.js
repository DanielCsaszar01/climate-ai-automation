// Chatbot widget JavaScript - integráció az n8n AI Agent webhookkal

class KlimaprofiChatbot {
    constructor(webhookUrl) {
        // Az n8n Webhook node "Production URL"-je (teljes útvonal!)
        this.webhookUrl = webhookUrl;
        // Beszélgetés-azonosító a memóriához (böngészőben megmarad újratöltés után is)
        this.sessionId = this.getOrCreateSessionId();
        this.conversationHistory = [];
        this.init();
    }

    getOrCreateSessionId() {
        let id = null;
        try {
            id = localStorage.getItem('klimaprofi_session_id');
            if (!id) {
                id = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
                localStorage.setItem('klimaprofi_session_id', id);
            }
        } catch (e) {
            // Ha a localStorage nem elérhető, munkamenetre szóló azonosító
            id = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
        }
        return id;
    }

    init() {
        this.setupEventListeners();
        this.addSystemMessage("Üdvözlöm a KlímaProfi Kft.-nél! 👋 Anna vagyok, az ügyfélszolgálatos asszisztens. Miben segíthetek? Klíma vásárlás, telepítés, tisztítás vagy szerviz?");
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
        const message = inputField.value.trim();

        if (!message) return;

        this.addUserMessage(message);
        inputField.value = '';
        this.addTypingIndicator();

        try {
            const response = await fetch(this.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    sessionId: this.sessionId
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            this.removeTypingIndicator();

            // Rugalmas válasz-kiolvasás: több lehetséges kulcsot is kezel,
            // hogy az n8n "Respond to Webhook" node beállításától függetlenül működjön.
            const botText = this.extractBotText(data);

            if (botText) {
                this.addBotMessage(botText);
            } else {
                this.addBotMessage("⚠️ Sajnos most nem érkezett válasz. Kérem, próbálja újra, vagy hívjon minket: +36 1 234 5678");
            }
        } catch (error) {
            console.error('Chatbot error:', error);
            this.removeTypingIndicator();
            this.addBotMessage("⚠️ Sajnos hiba történt. Kérem, próbálja később, vagy hívjon minket: +36 1 234 5678");
        }
    }

    extractBotText(data) {
        if (!data) return '';
        if (typeof data === 'string') return data;
        // Gyakori kulcsok n8n-ből: response, output, text, message, answer
        return data.response || data.output || data.text || data.message || data.answer || '';
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
        // A bot szövegét is escape-eljük, majd a sortöréseket <br>-re cseréljük
        const safe = this.escapeHtml(text).replace(/\n/g, '<br>');
        msgDiv.innerHTML = `<p style="background: #f0f0f0; padding: 0.7rem; border-radius: 8px; display: inline-block; max-width: 80%; word-wrap: break-word;">${safe}</p>`;
        messagesDiv.appendChild(msgDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        this.conversationHistory.push({ role: 'bot', content: text });
    }

    addSystemMessage(text) {
        const messagesDiv = document.getElementById('chatbot-messages');
        const msgDiv = document.createElement('div');
        msgDiv.style.cssText = 'margin-bottom: 0.8rem; text-align: center;';
        msgDiv.innerHTML = `<p style="background: #e8f4f8; color: #0099ff; padding: 0.7rem; border-radius: 8px; display: inline-block; font-size: 0.9rem;">${this.escapeHtml(text)}</p>`;
        messagesDiv.appendChild(msgDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    addTypingIndicator() {
        const messagesDiv = document.getElementById('chatbot-messages');
        const msgDiv = document.createElement('div');
        msgDiv.id = 'typing-indicator';
        msgDiv.style.cssText = 'margin-bottom: 0.8rem;';
        msgDiv.innerHTML = `<p style="background: #f0f0f0; padding: 0.7rem; border-radius: 8px; display: inline-block;">⏳ Gondolkodom...</p>`;
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
    // ⬇️ IDE ÍRD BE az n8n Webhook node "Production URL"-jét (teljes útvonal):
    const WEBHOOK_URL = 'https://csuszi.app.n8n.cloud/webhook/klimaprofi-chat';

    window.chatbot = new KlimaprofiChatbot(WEBHOOK_URL);
});

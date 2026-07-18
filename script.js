const assistantPanel = document.getElementById('assistant');
const assistantBody = document.getElementById('assistantBody');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const openChatButton = document.getElementById('openChatButton');
let typingBubble = null;

function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function formatAiText(text) {
    const escaped = escapeHtml(text);
    const withBold = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    return withBold.replace(/\r?\n/g, '<br />');
}

function addMessage(text, sender) {
    const bubble = document.createElement('div');
    bubble.className = sender === 'user' ? 'bubble user-bubble' : 'bubble ai-bubble';

    if (sender === 'ai') {
        bubble.innerHTML = formatAiText(text);
    } else {
        bubble.textContent = text;
    }

    assistantBody.appendChild(bubble);
    assistantBody.scrollTop = assistantBody.scrollHeight;
}

function addStatus(text) {
    const bubble = document.createElement('div');
    bubble.className = 'bubble wait-note';
    bubble.textContent = text;
    assistantBody.appendChild(bubble);
    assistantBody.scrollTop = assistantBody.scrollHeight;
}

function showTypingIndicator() {
    if (typingBubble) return;
    typingBubble = document.createElement('div');
    typingBubble.className = 'bubble typing-indicator';
    typingBubble.textContent = 'AI is typing...';
    assistantBody.appendChild(typingBubble);
    assistantBody.scrollTop = assistantBody.scrollHeight;
}

function removeTypingIndicator() {
    if (!typingBubble) return;
    typingBubble.remove();
    typingBubble = null;
}

if (openChatButton && messageInput && assistantPanel) {
    openChatButton.addEventListener('click', () => {
        assistantPanel.classList.add('open');
        assistantPanel.classList.remove('closed');
        assistantPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => messageInput.focus(), 350);
    });
}

// Send message to n8n
async function askAI(message) {
    const start = performance.now();
    showTypingIndicator();

    try {
        const response = await fetch(
            'https://sushmit.app.n8n.cloud/webhook/reatestatechat',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message })
            }
        );

        const elapsed = (performance.now() - start) / 1000;
        removeTypingIndicator();

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server Error: ${errorText || response.status}`);
        }

        const rawText = await response.text();
        let data = null;

        if (rawText.trim()) {
            try {
                data = JSON.parse(rawText);
            } catch (err) {
                data = rawText;
            }
        }

        const reply =
            (data && typeof data === 'object' &&
                (data.output || data.reply || data.text || data.response)) ||
            (typeof data === 'string' ? data : '') ||
            '✅ AI Agent responded successfully, but the response body was empty.';

        addMessage(reply, 'ai');
        addStatus(`Response time: ${elapsed.toFixed(2)}s`);
    } catch (error) {
        removeTypingIndicator();
        console.error(error);
        addMessage('❌ Unable to connect to the AI Agent.', 'ai');
        addStatus(`Response time: ${(performance.now() - start / 1000).toFixed(2)}s`);
    }
}

if (sendButton && messageInput && assistantBody) {
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}

function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;
    addMessage(message, 'user');
    messageInput.value = '';
    askAI(message);
}

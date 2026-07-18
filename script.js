const assistantPanel = document.getElementById("assistant");
const assistantBody = document.getElementById("assistantBody");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const openChatButton = document.getElementById("openChatButton");

let typingBubble = null;

// Open chat
openChatButton.addEventListener("click", () => {
    assistantPanel.classList.remove("closed");
    assistantPanel.classList.add("open");
    messageInput.focus();
});

// Escape HTML
function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

// Format AI message
function formatAI(text) {
    return escapeHtml(text)
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\n/g, "<br>");
}

// Add message
function addMessage(text, sender) {

    const bubble = document.createElement("div");

    bubble.className =
        sender === "user"
            ? "bubble user-bubble"
            : "bubble ai-bubble";

    if (sender === "ai") {
        bubble.innerHTML = formatAI(text);
    } else {
        bubble.textContent = text;
    }

    assistantBody.appendChild(bubble);

    assistantBody.scrollTop = assistantBody.scrollHeight;
}

// Typing indicator
function showTyping() {

    typingBubble = document.createElement("div");

    typingBubble.className = "bubble ai-bubble";

    typingBubble.innerHTML = "⌛ AI is typing...";

    assistantBody.appendChild(typingBubble);

    assistantBody.scrollTop = assistantBody.scrollHeight;

}

function hideTyping() {

    if (typingBubble) {

        typingBubble.remove();

        typingBubble = null;

    }

}

// Call n8n
async function askAI(message) {

    showTyping();

    try {

        const response = await fetch(
            "https://sushmit.app.n8n.cloud/webhook-test/reatestatechat",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    message: message
                })
            }
        );

        hideTyping();

        if (!response.ok) {

            throw new Error(
                "Server Error " + response.status
            );

        }

        const raw = await response.text();

        console.log("Webhook Response:", raw);

        let reply = raw;

        try {

            const data = JSON.parse(raw);

            reply =
                data.output ||
                data.reply ||
                data.text ||
                data.response ||
                raw;

        } catch (e) {}

        addMessage(reply, "ai");

    } catch (err) {

        hideTyping();

        console.error(err);

        addMessage(
            "❌ Unable to connect to AI Agent.",
            "ai"
        );

    }

}

// Send
function sendMessage() {

    const message = messageInput.value.trim();

    if (!message) return;

    addMessage(message, "user");

    messageInput.value = "";

    askAI(message);

}

sendButton.addEventListener("click", sendMessage);

messageInput.addEventListener("keydown", function (e) {

    if (e.key === "Enter") {

        e.preventDefault();

        sendMessage();

    }

});
let socket;
let messageInput;
let nameInput;
let messagesContainer;
let messageForm;
let typingIndicator;
let typingTimeout;

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded");

    // Initialize socket connection
    socket = io({
        reconnectionAttempts: 5,
        timeout: 10000
    });

    socket.on("connect", () => {
        console.log("Connected to server");
        initializeChat();
    });

    socket.on("disconnect", (reason) => {
        console.log("Disconnected from server:", reason);
    });

    socket.on("reconnect", (attemptNumber) => {
        console.log("Reconnected to server after", attemptNumber, "attempts");
    });

    socket.on("reconnect_error", (error) => {
        console.error("Failed to reconnect:", error);
    });

    socket.on("clients-total", (data) => {
        console.log("Received clients-total:", data);
        updateClientTotal(data);
    });

    // Ping the server every 25 seconds to keep the connection alive
    setInterval(() => {
        if (socket.connected) {
            socket.emit("ping");
        }
    }, 25000);

    socket.on("pong", () => {
        console.log("Received pong from server");
    });

    socket.on("user-typing", (data) => {
        showTypingIndicator(data);
    });

    socket.on("user-stop-typing", (data) => {
        hideTypingIndicator(data);
    });
});

function initializeChat() {
    console.log("Initializing chat");

    messagesContainer = document.getElementById('messages-container');
    nameInput = document.getElementById('name-input');
    messageInput = document.getElementById('message-input');
    messageForm = document.getElementById('message-form');
    typingIndicator = document.getElementById('typing-indicator');

    if (!messageForm) {
        console.error("Message form not found");
        return;
    }

    messageForm.addEventListener('submit', handleFormSubmit);
    console.log("Form submit event listener added");

    messageInput.addEventListener('input', handleTyping);

    socket.on('chat-message', (data) => {
        console.log('Received message:', data);
        addMessageToUI(data);
    });
}

function handleFormSubmit(e) {
    e.preventDefault();
    console.log("Form submitted");
    sendMessage();
}

function handleTyping() {
    socket.emit('typing', { name: nameInput.value || 'Anonymous' });

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        socket.emit('stop-typing', { name: nameInput.value || 'Anonymous' });
    }, 1000);
}

function showTypingIndicator(data) {
    if (!typingIndicator) return;
    typingIndicator.textContent = `${data.name} is typing...`;
    typingIndicator.style.display = 'block';
}

function hideTypingIndicator(data) {
    if (!typingIndicator) return;
    typingIndicator.style.display = 'none';
}

function sendMessage() {
    console.log("sendMessage called");

    if (!messageInput || messageInput.value.trim() === '') {
        console.log("Message input is empty");
        return;
    }

    const data = {
        name: nameInput.value || 'Anonymous',
        message: messageInput.value,
        dateTime: new Date(),
        socketId: socket.id  // Add the socket ID to identify the sender
    }

    console.log("Sending message:", data);

    socket.emit('message', data);
    addMessageToUI(data);
    messageInput.value = '';
}

function addMessageToUI(data) {
    console.log("addMessageToUI called", data);

    if (!messagesContainer) {
        console.error("Messages container not found");
        return;
    }

    const formattedDate = new Date(data.dateTime).toLocaleTimeString();
    const isOwnMessage = data.socketId === socket.id;

    const messageElement = document.createElement('li');
    messageElement.classList.add(isOwnMessage ? 'message-right' : 'message-left');

    messageElement.innerHTML = `
        <p class="message">
            ${data.message}
            <span>${data.name} 🥊 ${formattedDate}</span>
        </p>
    `;

    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function updateClientTotal(count) {
    const clientsTotalElement = document.getElementById('clients-total');
    if (clientsTotalElement) {
        clientsTotalElement.textContent = `Total clients: ${count}`;
    }
}

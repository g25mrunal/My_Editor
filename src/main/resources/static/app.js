var stompClient = null;
var sessionId = Math.random().toString(36).substring(7);

// --- State Variables ---
var currentFileId = "script-js"; // Default file
var currentSubscription = null;
// REMOVED: No more local fileContentCache. The server is the boss.

// --- UI Elements ---
var statusDot = document.getElementById('status-dot');
var statusText = document.getElementById('status-text');
var currentFilenameEl = document.getElementById('current-filename');
var fileItems = document.querySelectorAll('.file-item');

// --- CodeMirror Editor ---
var editor = CodeMirror(document.getElementById('editor-container'), {
    lineNumbers: true,
    mode: 'javascript', // Default mode
    theme: 'material'
});
// REMOVED: Don't set value from cache

// --- Connection Logic ---
function connect() {
    statusText.textContent = 'Connecting...';
    statusDot.style.backgroundColor = '#f1c40f'; // Yellow
    var socket = new SockJS('/ws-editor');
    stompClient = Stomp.over(socket);

    stompClient.connect({}, function(frame) {
        console.log('Connected: ' + frame);
        statusText.textContent = 'Connected';
        statusDot.style.backgroundColor = '#2ecc71'; // Green
        
        // Subscribe to the default file when we first connect
        subscribeToFile(currentFileId);
    });

    socket.onclose = function() {
        console.log('Disconnected');
        statusText.textContent = 'Disconnected';
        statusDot.style.backgroundColor = '#e74c3c'; // Red
    };
}

// --- Subscription Logic (UPDATED) ---
function subscribeToFile(fileId) {
    // 1. Unsubscribe from the old topic
    if (currentSubscription) {
        currentSubscription.unsubscribe();
    }
    
    // 2. Set new file as active
    currentFileId = fileId;
    
    // 3. Update the UI (header, syntax highlighting)
    var fileEl = document.querySelector(`.file-item[data-file-id="${fileId}"]`);
    var newMode = fileEl.getAttribute('data-mode');
    var newName = fileEl.getAttribute('data-file-name');
    editor.setOption("mode", newMode);
    currentFilenameEl.textContent = newName;
    
    // 4. Clear the editor (it will be filled by the server)
    editor.setValue(""); 

    // 5. Subscribe to the new topic
    var topic = `/topic/document/${fileId}`;
    currentSubscription = stompClient.subscribe(topic, function(message) {
        receiveMessage(JSON.parse(message.body));
    });

    // 6. NEW: Ask the server for the file's current content
    stompClient.send(`/app/document.get/${currentFileId}`, {}, "{}");

    console.log(`Subscribed to ${topic}`);
}

// --- Messaging Logic (UPDATED) ---
function sendMessage() {
    var content = editor.getValue();
    // REMOVED: No cache update
    
    // Send the edit to the server
    stompClient.send(`/app/document.edit/${currentFileId}`, {}, JSON.stringify({
        'content': content,
        'senderId': sessionId
    }));
}

function receiveMessage(message) {
    // NEW: Check if this is the full content from the server
    if (message.senderId === "server-sync") {
        // This is the full content sync, set it directly
        var cursor = editor.getCursor();
        editor.setValue(message.content);
        editor.setCursor(cursor);
    }
    // This is a regular edit from *another* user
    else if (message.senderId !== sessionId) {
        var cursor = editor.getCursor();
        editor.setValue(message.content);
        editor.setCursor(cursor);
    }
    // (We ignore messages from ourself)
}

// --- Event Listeners (No Changes) ---
editor.on('change', function(instance, changeObj) {
    if (changeObj.origin !== 'setValue') {
        sendMessage();
    }
});

fileItems.forEach(function(item) {
    item.addEventListener('click', function() {
        fileItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        var newFileId = item.getAttribute('data-file-id');
        subscribeToFile(newFileId);
    });
});

// Start the application
connect();
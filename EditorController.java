package com.Project.My_Editor;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Controller
public class EditorController {

    // NEW: A map to store the current content of each "file" on the server
    private Map<String, String> fileContents = new ConcurrentHashMap<>();

    /**
     * This method handles a user editing a file.
     * It saves the new content and broadcasts it.
     */
    @MessageMapping("/document.edit/{fileId}")
    @SendTo("/topic/document/{fileId}")
    public DocumentMessage handleEdit(@DestinationVariable String fileId, DocumentMessage message) {
        // Save the latest content to our map
        fileContents.put(fileId, message.getContent());
        // Broadcast the change to all subscribers
        return message;
    }

    /**
     * NEW: This method is called when a user *first* opens a file.
     * It fetches the current content from the map and sends it back.
     */
    @MessageMapping("/document.get/{fileId}")
    @SendTo("/topic/document/{fileId}")
    public DocumentMessage getContent(@DestinationVariable String fileId) {
        // Get the saved content, or get the default content if it's not in the map
        String content = fileContents.getOrDefault(fileId, getDefaultContent(fileId));
        
        DocumentMessage response = new DocumentMessage();
        response.setContent(content);
        // Use a special senderId so the client knows this is a "sync" message
        response.setSenderId("server-sync"); 
        return response;
    }

    /**
     * NEW: A helper method to provide default content for empty files.
     */
    private String getDefaultContent(String fileId) {
        return switch (fileId) {
            case "script-js" -> "console.log('Hello from script.js');";
            case "index-html" -> "<h1>Hello from index.html</h1>";
            case "style-css" -> "body {\n  background-color: #f0f0f0;\n}";
            default -> "";
        };
    }
}
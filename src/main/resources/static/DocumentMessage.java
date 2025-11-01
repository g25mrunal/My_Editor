package com.myproject.liveeditor;

public class DocumentMessage {

    private String content;
    private String senderId;

    // A default constructor is required for JSON parsing
    public DocumentMessage() {
    }

    // Getters and Setters are also required
    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getSenderId() {
        return senderId;
    }

    public void setSenderId(String senderId) {
        this.senderId = senderId;
    }
}
package com.prescribecorrect.app.service.imp;

import com.prescribecorrect.app.dto.ChatDTO;
import com.prescribecorrect.app.exception.NotFoundException;
import com.prescribecorrect.app.model.Chat;
import com.prescribecorrect.app.model.Message;
import com.prescribecorrect.app.model.User;
import com.prescribecorrect.app.repository.ChatRepository;
import com.prescribecorrect.app.repository.MessageRepository;
import com.prescribecorrect.app.repository.UserRepository;
import com.prescribecorrect.app.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;


@Service
public class ChatServiceImp implements ChatService {

    ChatDTO convertChatDTO(Chat chat) {
        ChatDTO chatDTO = new ChatDTO();
        chatDTO.setId(chat.getId());
        chatDTO.setName(chat.getName());
        chatDTO.setMessages(
                chat.getMessages().stream()
                        .peek(m -> m.setChat(null))
                        .toList()
        );
        chatDTO.setCreatedAt(chat.getCreatedAt());
        chatDTO.setUpdatedAt(chat.getUpdatedAt());
        return chatDTO;
    }

    @Autowired
    private ChatRepository chatRepository;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    public Long create(String email) {
        User user = userRepository.getUserByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return chatRepository.save(new Chat(user)).getId();
    }

    @Override
    public ChatDTO getChatById(Long id) throws NotFoundException {
        Chat chat = chatRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Chat not found with this id ..."));
        chat.getMessages().sort((m1, m2) -> m2.getCreatedAt().compareTo(m1.getCreatedAt()));
        return  convertChatDTO(chat);
    }

    @Override
    public Long updateChat(Long id, Message message) throws NotFoundException {
        Chat chat = chatRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Chat not found with this id ..."));
        chat.setUpdatedAt(LocalDateTime.now());
        if(chat.getName() == null) {
            chat.setName(message.getMessage());
        }
        message.setChat(chat);
        return messageRepository.save(message).getId();
    }

    @Override
    public void delete(Long id) {
        chatRepository.deleteById(id);
    }
}

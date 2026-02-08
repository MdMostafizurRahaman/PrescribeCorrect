package com.prescribecorrect.app.service;

import com.prescribecorrect.app.dto.ChatDTO;
import com.prescribecorrect.app.exception.NotFoundException;
import com.prescribecorrect.app.model.Chat;
import com.prescribecorrect.app.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;

public interface ChatService {
    Long create(String email);

    ChatDTO getChatById(Long id) throws NotFoundException;

    Long updateChat(Long id, Message message) throws NotFoundException;

    void delete(Long id);
}

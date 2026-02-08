package com.prescribecorrect.app.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.prescribecorrect.app.model.ChatRole;
import com.prescribecorrect.app.model.Message;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ChatDTO {
    Long id;
    private String name;
    List<Message> messages;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}

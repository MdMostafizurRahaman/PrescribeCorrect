package com.prescribecorrect.app.repository;

import com.prescribecorrect.app.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MessageRepository extends JpaRepository<Message, Long> {
}

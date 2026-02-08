package com.prescribecorrect.app.service;

import com.prescribecorrect.app.dto.ChatDTO;
import com.prescribecorrect.app.dto.UserDTO;
import com.prescribecorrect.app.exception.NotFoundException;
import com.prescribecorrect.app.model.Chat;
import com.prescribecorrect.app.model.User;
import org.apache.coyote.BadRequestException;

import java.util.List;

public interface UserService {
    UserDTO getUserByEmail(String email) throws NotFoundException, BadRequestException;
    UserDTO getAdminByEmail(String email) throws NotFoundException, BadRequestException;

    UserDTO save(User user) ;

    List<UserDTO> findAllUsers();
    List<UserDTO> findAllAdmin();

    void delete(String email) throws NotFoundException;

    UserDTO update(User user);

    List<ChatDTO> getAllChats(String email) throws NotFoundException;


}

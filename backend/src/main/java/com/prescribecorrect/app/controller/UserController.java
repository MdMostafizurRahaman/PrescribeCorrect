package com.prescribecorrect.app.controller;

import com.prescribecorrect.app.dto.ChatDTO;
import com.prescribecorrect.app.dto.UserDTO;
import com.prescribecorrect.app.exception.NotFoundException;
import com.prescribecorrect.app.model.Chat;
import com.prescribecorrect.app.model.Role;
import com.prescribecorrect.app.model.User;
import com.prescribecorrect.app.service.UserService;
import org.apache.coyote.BadRequestException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private UserService userService;


    @PostMapping("/sign-up")
    public ResponseEntity<?> singUp(@RequestBody User user) {
            user.setRole(Role.ROLE_USER);
            UserDTO createdUser = userService.save(user);
            return new ResponseEntity<>(createdUser, HttpStatus.CREATED);
    }

    @GetMapping("/all")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        return ResponseEntity.ok(userService.findAllUsers());
    }

    @GetMapping("/{email}")
    public ResponseEntity<UserDTO> getUser(@PathVariable String email) throws NotFoundException, BadRequestException {

        return ResponseEntity.ok(userService.getUserByEmail(email));
    }

    @PreAuthorize("hasRole('USER')")
    @PutMapping("")
    public ResponseEntity<?> updateUser(Authentication auth, @RequestBody User user) throws NotFoundException {
        user.setEmail(auth.getName());
        user.setRole(Role.ROLE_USER);
        return ResponseEntity.ok(userService.update(user));
    }

    @PreAuthorize("hasRole('USER')")
    @DeleteMapping("")
    public ResponseEntity<?> deleteUser(Authentication auth) throws NotFoundException {
        userService.delete(auth.getName());
        return ResponseEntity.ok().build();
    }


    // for chat
    @GetMapping("/chat")
    public ResponseEntity<List<ChatDTO>> getAllChats(Authentication auth) throws NotFoundException {
        String email = auth.getName();
        return ResponseEntity.ok(userService.getAllChats(email));
    }
}

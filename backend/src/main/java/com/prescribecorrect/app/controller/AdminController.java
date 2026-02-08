package com.prescribecorrect.app.controller;

import com.prescribecorrect.app.dto.UserDTO;
import com.prescribecorrect.app.exception.NotFoundException;
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
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private UserService userService;


    @PostMapping("/sign-up")
    public ResponseEntity<?> singUp(@RequestBody User user) {
        user.setRole(Role.ROLE_ADMIN);
        UserDTO createdAdmin = userService.save(user);
        return new ResponseEntity<>(createdAdmin, HttpStatus.CREATED);
    }

    @GetMapping("/all")
    public ResponseEntity<List<UserDTO>> getAllAdmin() {
        return ResponseEntity.ok(userService.findAllAdmin());
    }

    @GetMapping("/{email}")
    public ResponseEntity<UserDTO> getAdmin(@PathVariable String email) throws NotFoundException, BadRequestException {

        return ResponseEntity.ok(userService.getAdminByEmail(email));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("")
    public ResponseEntity<?> updateAdmin(Authentication auth, @RequestBody User user) throws NotFoundException {
        user.setEmail(auth.getName());
        user.setRole(Role.ROLE_ADMIN);
        return ResponseEntity.ok(userService.update(user));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("")
    public ResponseEntity<Void> deleteAdmin(Authentication auth) throws NotFoundException {
        userService.delete(auth.getName());
        return ResponseEntity.ok().build();
    }
}

package com.prescribecorrect.app.controller;

import com.prescribecorrect.app.dto.UserDTO;
import com.prescribecorrect.app.model.User;
import com.prescribecorrect.app.security.JwtUtil;
import com.prescribecorrect.app.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User user) {
        try {
            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            user.getEmail(),
                            user.getPassword()
                    )
            );

            String token = jwtUtil.generateToken(user.getEmail());

            String role = String.valueOf(auth.getAuthorities().stream().findFirst().get()).substring(5).toLowerCase();
            Map<String, String> response = new HashMap<>();
            response.put("role", role);
            response.put("token", token);

            return ResponseEntity.ok(response);

        } catch (BadCredentialsException e) {
            // Always return valid JSON
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new java.util.HashMap<String, Object>() {{
                    put("error", "Invalid credentials");
                }});
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
        }
    }
}

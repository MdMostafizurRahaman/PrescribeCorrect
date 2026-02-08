package com.prescribecorrect.app.service.imp;

import com.prescribecorrect.app.model.Role;
import com.prescribecorrect.app.model.User;
import com.prescribecorrect.app.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;


@Service
public class UserDetailsServiceImp implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = (User) userRepository.getUserByEmail(email)
                .orElseThrow(
                () -> new UsernameNotFoundException("User not found")
        );
        return new MyUserDetails(user);
    }
    
    // Method to create a minimal user record for JWT authentication if user doesn't exist
    public UserDetails loadUserByUsernameOrCreate(String email) {
        try {
            return loadUserByUsername(email);
        } catch (UsernameNotFoundException e) {
            // Create a minimal user record for authentication purposes
            User tempUser = new User();
            tempUser.setEmail(email);
            tempUser.setRole(Role.ROLE_USER);
            tempUser.setFirstName("User"); // Default first name
            tempUser.setLastName(""); // Default last name
            return new MyUserDetails(tempUser);
        }
    }
}

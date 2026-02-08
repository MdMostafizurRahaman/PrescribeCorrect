package com.prescribecorrect.app.service.imp;

import com.prescribecorrect.app.dto.ChatDTO;
import com.prescribecorrect.app.dto.UserDTO;
import com.prescribecorrect.app.exception.NotFoundException;
import com.prescribecorrect.app.model.Chat;
import com.prescribecorrect.app.model.Role;
import com.prescribecorrect.app.model.User;
import com.prescribecorrect.app.repository.UserRepository;
import com.prescribecorrect.app.service.ChatService;
import com.prescribecorrect.app.service.UserService;
import org.apache.coyote.BadRequestException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
public class UserServiceImp implements UserService {

    UserDTO convertUserDTO(User user) {
    UserDTO userDTO = new UserDTO();
    userDTO.setFirstName(user.getFirstName());
    userDTO.setLastName(user.getLastName());
    userDTO.setEmail(user.getEmail());
    userDTO.setPhoneNumber(user.getPhoneNumber());
    userDTO.setDateOfBirth(user.getDateOfBirth());
    userDTO.setGender(user.getGender());
    userDTO.setBloodGroup(user.getBloodGroup());
    userDTO.setEmergencyContact(user.getEmergencyContact());
    userDTO.setAddress(user.getAddress());
    userDTO.setMedicalHistory(user.getMedicalHistory());
    userDTO.setAllergies(user.getAllergies());
    userDTO.setCurrentMedications(user.getCurrentMedications());
    return userDTO;
    }

    @Autowired
    private BCryptPasswordEncoder bCryptPasswordEncoder;

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDTO getUserByEmail(String email) throws NotFoundException, BadRequestException {
        User user = userRepository.getUserByEmail(email)
                .orElseThrow(() -> new NotFoundException("user not found with this email ..."));
        if (user.getRole() != Role.ROLE_USER) {
            throw new BadRequestException("this is not a user's email ...");
        }
        return convertUserDTO(user);
    }

    @Override
    public UserDTO getAdminByEmail(String email) throws NotFoundException, BadRequestException {
        User user = userRepository.getUserByEmail(email)
                .orElseThrow(() -> new NotFoundException("user not found with this email ..."));
        if (user.getRole() != Role.ROLE_ADMIN) {
            throw new BadRequestException("this is not a admin's email ...");
        }
        return convertUserDTO(user);
    }


    @Override
    public UserDTO save(User user) {
        if (userRepository.getUserByEmail(user.getEmail()).isPresent()) {
            throw new IllegalArgumentException("An account already exists with this email ...");
        }

        user.setPassword(bCryptPasswordEncoder.encode(user.getPassword()));
        User result = userRepository.save(user);
        return convertUserDTO(result);
    }

    @Override
    public List<UserDTO> findAllUsers() {
        List<User> users = userRepository.findByRole(Role.ROLE_USER);
        return users.stream().map(this::convertUserDTO).toList();
    }

    @Override
    public List<UserDTO> findAllAdmin() {
        List<User> users = userRepository.findByRole(Role.ROLE_ADMIN);
        return users.stream().map(this::convertUserDTO).toList();
    }

    @Override
    public void delete(String email) throws NotFoundException {
        User user = userRepository.getUserByEmail(email)
                        .orElseThrow(() -> new NotFoundException("user not found ..."));
        userRepository.delete(user);
    }

    @Override
    public UserDTO update(User user) {
        Optional<User> existingUserOpt = userRepository.getUserByEmail(user.getEmail());
        
        if (existingUserOpt.isPresent()) {
            // User exists, update the existing user
            User existingUser = existingUserOpt.get();
            // Update all fields
            existingUser.setFirstName(user.getFirstName());
            existingUser.setLastName(user.getLastName());
            existingUser.setPhoneNumber(user.getPhoneNumber());
            existingUser.setDateOfBirth(user.getDateOfBirth());
            existingUser.setGender(user.getGender());
            existingUser.setBloodGroup(user.getBloodGroup());
            existingUser.setEmergencyContact(user.getEmergencyContact());
            existingUser.setAddress(user.getAddress());
            // Safely update medicalHistory to avoid orphan removal error
            // Do not modify medicalHistory collection as it's managed by prescription analysis operations
            // medicalHistory should only be updated through PrescriptionAnalysis entity operations
            // Comment out the problematic medicalHistory update to prevent orphan removal error
            // if (existingUser.getMedicalHistory() != null && user.getMedicalHistory() != null) {
            //     existingUser.getMedicalHistory().clear();
            //     existingUser.getMedicalHistory().addAll(user.getMedicalHistory());
            // } else {
            //     existingUser.setMedicalHistory(user.getMedicalHistory());
            // }
            existingUser.setAllergies(user.getAllergies());
            existingUser.setCurrentMedications(user.getCurrentMedications());
            User useredited = userRepository.save(existingUser);
            return convertUserDTO(useredited);
        } else {
            // User doesn't exist, create a new user profile
            user.setPassword(bCryptPasswordEncoder.encode("profile_user_" + System.currentTimeMillis()));
            User newUser = userRepository.save(user);
            return convertUserDTO(newUser);
        }
    }

    @Autowired
    private ChatServiceImp chatService;

    @Override
    public List<ChatDTO> getAllChats(String email) throws NotFoundException {
        User user = userRepository.findByEmailWithChats(email)
                .orElseThrow(() -> new NotFoundException("user not found ..."));

        List<ChatDTO> chatsDTO = user.getChats().stream()
                .sorted(Comparator.comparing(Chat::getCreatedAt).reversed()) // sort newest first
                .map(chatService::convertChatDTO)
                .peek(chatDTO -> chatDTO.setMessages(null))
                .toList();

        return chatsDTO;
    }

}

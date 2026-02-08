package com.prescribecorrect.app.repository;

import com.prescribecorrect.app.model.Role;
import com.prescribecorrect.app.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
     Optional<User> getUserByEmail(String email);

     List<User> findByRole(Role role);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.chats WHERE u.email = :email")
    Optional<User> findByEmailWithChats(@Param("email") String email);

}

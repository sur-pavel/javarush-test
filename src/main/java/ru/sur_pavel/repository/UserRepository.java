package ru.sur_pavel.repository;

import org.springframework.data.repository.PagingAndSortingRepository;
import ru.sur_pavel.domain.User;

import java.util.List;

public interface UserRepository extends PagingAndSortingRepository<User, Integer> {
    List<User> findByName(String name);
    List<User> findByIsAdmin(boolean isAdmin);
}

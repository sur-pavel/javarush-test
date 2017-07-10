package ru.sur_pavel.repository;

import org.springframework.data.repository.PagingAndSortingRepository;
import ru.sur_pavel.domain.User;

public interface UserRepository extends PagingAndSortingRepository<User, Integer> {
}

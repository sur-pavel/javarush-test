package ru.sur_pavel;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.junit4.SpringRunner;
import ru.sur_pavel.domain.User;
import ru.sur_pavel.repository.UserRepository;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@RunWith(SpringRunner.class)
@DataJpaTest
public class UserRepositoryTests {
    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private UserRepository users;

    @Test
    public void testFindByName() {
        User user = new User("first", 10, true);
        entityManager.persist(user);

        List<User> findByUserName = users.findByName(user.getName());

        assertThat(findByUserName).extracting(User::getName).containsOnly(user.getName());
    }

    @Test
    public void testFindAllAdmins(){
        User user = new User("first", 10, true);
        entityManager.persist(user);
        List<User> findAllAdmins = users.findByIsAdmin(user.isAdmin());
        assertThat(findAllAdmins).extracting(User::isAdmin).containsOnly(user.isAdmin());
    }
}
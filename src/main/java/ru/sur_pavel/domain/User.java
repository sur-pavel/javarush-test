package ru.sur_pavel.domain;

import javax.persistence.*;
import java.sql.Timestamp;
import java.text.SimpleDateFormat;

@Entity // This tells Hibernate to make a table out of this class
public class User {


    @Id
    @GeneratedValue(strategy=GenerationType.AUTO)
    private Integer id;
    @Column(length = 25)
    private String name;
    private int age;
    private boolean isAdmin;
    private Timestamp createdDate;

    public User() {}

    public User(String name, int age, boolean isAdmin) {
        this.name = name;
        this.age = age;
        this.isAdmin = isAdmin;
        setCreatedDate();
    }

    public String getCreatedDate() {
        String s = new SimpleDateFormat("dd.MM.yyyy HH:mm:ss").format(this.createdDate);
        return s;
    }

    public void setCreatedDate() {
        this.createdDate = new Timestamp(System.currentTimeMillis());
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getAge() {
        return age;
    }

    public void setAge(int age) {
        this.age = age;
    }

    public boolean isAdmin() {
        return isAdmin;
    }

    public void setAdmin(boolean admin) {
        isAdmin = admin;
    }



}


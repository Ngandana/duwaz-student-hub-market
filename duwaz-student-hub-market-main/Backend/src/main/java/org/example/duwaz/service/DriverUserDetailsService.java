package org.example.duwaz.service;

import org.example.duwaz.classesFolder.DeliverDriver;
import org.example.duwaz.repo.DeliverDriverRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service("driverUserDetailsService")
public class DriverUserDetailsService implements UserDetailsService {

    @Autowired
    private DeliverDriverRepository driverRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        DeliverDriver driver = driverRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Driver not found: " + email));

        if (driver.getPassword() == null || driver.getPassword().isEmpty()) {
            throw new UsernameNotFoundException("Driver has no password set");
        }

        return new User(driver.getEmail(), driver.getPassword(), Collections.emptyList());
    }
}

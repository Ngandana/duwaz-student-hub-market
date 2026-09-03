package org.example.duwaz.controller;

import org.example.duwaz.classesFolder.DeliverDriver;
import org.example.duwaz.dto.AuthRequest;
import org.example.duwaz.dto.DriverAuthResponse;
import org.example.duwaz.dto.DriverRegisterRequest;
import org.example.duwaz.repo.DeliverDriverRepository;
import org.example.duwaz.security.LoginRateLimiter;
import org.example.duwaz.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth/driver")
public class DriverAuthController {

    private final DeliverDriverRepository driverRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final LoginRateLimiter loginRateLimiter;

    public DriverAuthController(DeliverDriverRepository driverRepository,
                                 JwtUtil jwtUtil,
                                 PasswordEncoder passwordEncoder,
                                 LoginRateLimiter loginRateLimiter) {
        this.driverRepository = driverRepository;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
        this.loginRateLimiter = loginRateLimiter;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody DriverRegisterRequest request) {
        if (driverRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().body("Email already registered");
        }
        if (driverRepository.existsByContactNumber(request.getContactNumber())) {
            return ResponseEntity.badRequest().body("Contact number already registered");
        }
        if (driverRepository.existsByLicenseNumber(request.getLicenseNumber())) {
            return ResponseEntity.badRequest().body("License number already registered");
        }

        DeliverDriver driver = new DeliverDriver();
        driver.setFirstName(request.getFirstName());
        driver.setLastName(request.getLastName());
        driver.setEmail(request.getEmail());
        driver.setPassword(passwordEncoder.encode(request.getPassword()));
        driver.setContactNumber(request.getContactNumber());
        driver.setVehicleType(request.getVehicleType());
        driver.setLicenseNumber(request.getLicenseNumber());
        driver.setEmergencyContact(request.getEmergencyContact());
        driver.setActive(true);
        driver.setStatus(DeliverDriver.DriverStatus.OFFLINE);

        driver = driverRepository.save(driver);

        String token = jwtUtil.generateToken(driver.getEmail(), driver.getDeliveryDriverId(), "DRIVER");

        return ResponseEntity.status(HttpStatus.CREATED).body(new DriverAuthResponse(
                token, driver.getDeliveryDriverId(),
                driver.getFirstName(), driver.getLastName(),
                driver.getEmail(), driver.getStatus().name()
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthRequest request, HttpServletRequest httpRequest) {
        String rateKey = httpRequest.getRemoteAddr() + ":" + request.getEmail().toLowerCase();
        if (!loginRateLimiter.allow(rateKey)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body("Too many login attempts. Please try again in a few minutes.");
        }

        Optional<DeliverDriver> driverOpt = driverRepository.findByEmail(request.getEmail());

        if (driverOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid email or password");
        }

        DeliverDriver driver = driverOpt.get();

        if (!driver.isActive()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Account is suspended");
        }

        if (driver.getPassword() == null || !passwordEncoder.matches(request.getPassword(), driver.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid email or password");
        }

        loginRateLimiter.reset(rateKey);

        String token = jwtUtil.generateToken(driver.getEmail(), driver.getDeliveryDriverId(), "DRIVER");

        return ResponseEntity.ok(new DriverAuthResponse(
                token, driver.getDeliveryDriverId(),
                driver.getFirstName(), driver.getLastName(),
                driver.getEmail(), driver.getStatus().name()
        ));
    }
}

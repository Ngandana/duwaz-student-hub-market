package org.example.duwaz.dto;

public class DriverAuthResponse {
    private String token;
    private Long driverId;
    private String firstName;
    private String lastName;
    private String email;
    private String role;
    private String status;

    public DriverAuthResponse(String token, Long driverId, String firstName,
                               String lastName, String email, String status) {
        this.token = token;
        this.driverId = driverId;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.role = "DRIVER";
        this.status = status;
    }

    public String getToken() { return token; }
    public Long getDriverId() { return driverId; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
    public String getStatus() { return status; }
}

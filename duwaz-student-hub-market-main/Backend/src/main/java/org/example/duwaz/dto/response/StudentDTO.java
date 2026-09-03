package org.example.duwaz.dto.response;

/** Never carries a password field — that's the whole point of this existing separately from Student. */
public record StudentDTO(
        Long id,
        String studentName,
        String studentNumber,
        String email,
        String role,
        String locationAddress,
        String profileImage
) {}

-- Fix roles: only vusuthandodube2@gmail.com should be ADMIN
-- All other accounts reset to CUSTOMER

UPDATE student SET role = 'CUSTOMER' WHERE email = 'reddisondredd@gmail.com';
UPDATE student SET role = 'CUSTOMER' WHERE email = 'mzobesindi70@gmail.com';

-- Confirm vusuthandodube2 is the only admin
UPDATE student SET role = 'ADMIN' WHERE email = 'vusuthandodube2@gmail.com';

-- Verify
SELECT id, email, role FROM student ORDER BY id;

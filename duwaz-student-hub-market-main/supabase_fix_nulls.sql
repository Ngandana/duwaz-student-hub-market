-- ================================================================
-- DUWAZ — RUN THIS IN SUPABASE SQL EDITOR
-- Fixes all missing columns that cause 500 errors
-- ================================================================

-- 1. Fix student role (NULL causes NPE on login)
UPDATE student SET role = 'CUSTOMER' WHERE role IS NULL;
UPDATE student SET role = 'ADMIN' WHERE email = 'reddisondredd@gmail.com';

-- Add role column if it doesn't exist at all
ALTER TABLE student ADD COLUMN IF NOT EXISTS role             VARCHAR(20)  NOT NULL DEFAULT 'CUSTOMER';
ALTER TABLE student ADD COLUMN IF NOT EXISTS email            VARCHAR(255);
ALTER TABLE student ADD COLUMN IF NOT EXISTS password         VARCHAR(255);
ALTER TABLE student ADD COLUMN IF NOT EXISTS location_address VARCHAR(255);
ALTER TABLE student ADD COLUMN IF NOT EXISTS profile_image   TEXT;

-- 2. store_messages — add all columns the entity expects
ALTER TABLE store_messages ADD COLUMN IF NOT EXISTS message_type  VARCHAR(30)  NOT NULL DEFAULT 'MESSAGE';
ALTER TABLE store_messages ADD COLUMN IF NOT EXISTS status        VARCHAR(20)  NOT NULL DEFAULT 'UNREAD';
ALTER TABLE store_messages ADD COLUMN IF NOT EXISTS subject       VARCHAR(255);
ALTER TABLE store_messages ADD COLUMN IF NOT EXISTS content       TEXT;
ALTER TABLE store_messages ADD COLUMN IF NOT EXISTS reply_content TEXT;
ALTER TABLE store_messages ADD COLUMN IF NOT EXISTS sent_at       TIMESTAMP    NOT NULL DEFAULT NOW();
ALTER TABLE store_messages ADD COLUMN IF NOT EXISTS read_at       TIMESTAMP;
ALTER TABLE store_messages ADD COLUMN IF NOT EXISTS replied_at    TIMESTAMP;
ALTER TABLE store_messages ADD COLUMN IF NOT EXISTS from_admin    BOOLEAN      NOT NULL DEFAULT FALSE;
ALTER TABLE store_messages ADD COLUMN IF NOT EXISTS driver_id     BIGINT       REFERENCES delivery_drivers(delivery_driver_id);
ALTER TABLE store_messages ADD COLUMN IF NOT EXISTS order_id      BIGINT       REFERENCES orders(id);

-- Make business_id nullable (driver-only messages have no business)
ALTER TABLE store_messages ALTER COLUMN business_id DROP NOT NULL;

-- Fix NULLs in existing rows
UPDATE store_messages SET message_type = 'MESSAGE'  WHERE message_type IS NULL;
UPDATE store_messages SET status       = 'UNREAD'   WHERE status IS NULL;
UPDATE store_messages SET from_admin   = FALSE       WHERE from_admin IS NULL;
UPDATE store_messages SET sent_at      = NOW()       WHERE sent_at IS NULL;

-- 3. business — add logo_url, student_id FK, and new shop detail columns
ALTER TABLE business ADD COLUMN IF NOT EXISTS logo_url        TEXT;
ALTER TABLE business ADD COLUMN IF NOT EXISTS student_id      BIGINT REFERENCES student(id);
ALTER TABLE business ADD COLUMN IF NOT EXISTS shop_category   VARCHAR(100);
ALTER TABLE business ADD COLUMN IF NOT EXISTS phone_number    VARCHAR(20);
ALTER TABLE business ADD COLUMN IF NOT EXISTS operating_hours VARCHAR(255);

-- 4. product — add new columns
ALTER TABLE product ADD COLUMN IF NOT EXISTS image_url      TEXT;
ALTER TABLE product ADD COLUMN IF NOT EXISTS stock_quantity INTEGER     NOT NULL DEFAULT 0;
ALTER TABLE product ADD COLUMN IF NOT EXISTS product_status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE';
ALTER TABLE product ADD COLUMN IF NOT EXISTS business_id    BIGINT      REFERENCES business(id);

UPDATE product SET stock_quantity  = 0           WHERE stock_quantity IS NULL;
UPDATE product SET product_status  = 'AVAILABLE' WHERE product_status IS NULL;

-- 5. delivery_drivers — add new columns
ALTER TABLE delivery_drivers ADD COLUMN IF NOT EXISTS password          VARCHAR(255);
ALTER TABLE delivery_drivers ADD COLUMN IF NOT EXISTS status            VARCHAR(20) NOT NULL DEFAULT 'OFFLINE';
ALTER TABLE delivery_drivers ADD COLUMN IF NOT EXISTS is_active         BOOLEAN     NOT NULL DEFAULT TRUE;
ALTER TABLE delivery_drivers ADD COLUMN IF NOT EXISTS profile_image     TEXT;
ALTER TABLE delivery_drivers ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(255);

UPDATE delivery_drivers SET status    = 'OFFLINE' WHERE status IS NULL;
UPDATE delivery_drivers SET is_active = TRUE       WHERE is_active IS NULL;

-- 6. delivery_assignments — add new columns
ALTER TABLE delivery_assignments ADD COLUMN IF NOT EXISTS delivery_status   VARCHAR(30) NOT NULL DEFAULT 'ASSIGNED';
ALTER TABLE delivery_assignments ADD COLUMN IF NOT EXISTS assigned_at       TIMESTAMP   NOT NULL DEFAULT NOW();
ALTER TABLE delivery_assignments ADD COLUMN IF NOT EXISTS accepted_at       TIMESTAMP;
ALTER TABLE delivery_assignments ADD COLUMN IF NOT EXISTS picked_up_at      TIMESTAMP;
ALTER TABLE delivery_assignments ADD COLUMN IF NOT EXISTS delivered_at      TIMESTAMP;
ALTER TABLE delivery_assignments ADD COLUMN IF NOT EXISTS delivery_notes    TEXT;
ALTER TABLE delivery_assignments ADD COLUMN IF NOT EXISTS failure_reason    VARCHAR(255);
ALTER TABLE delivery_assignments ADD COLUMN IF NOT EXISTS proof_of_delivery TEXT;
ALTER TABLE delivery_assignments ADD COLUMN IF NOT EXISTS otp_code          VARCHAR(10);
ALTER TABLE delivery_assignments ADD COLUMN IF NOT EXISTS otp_verified      BOOLEAN     NOT NULL DEFAULT FALSE;

-- 7. orders — add new columns
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address    VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancellation_reason VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS status              VARCHAR(30) NOT NULL DEFAULT 'PENDING';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_date          TIMESTAMP   NOT NULL DEFAULT NOW();
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_amount        NUMERIC(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS business_id         BIGINT      REFERENCES business(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS student_id          BIGINT      REFERENCES student(id);

UPDATE orders SET status     = 'PENDING' WHERE status IS NULL;
UPDATE orders SET order_date = NOW()      WHERE order_date IS NULL;

-- ================================================================
-- VERIFY: shows all students and their roles
SELECT id, email, role FROM student ORDER BY id;
-- ================================================================

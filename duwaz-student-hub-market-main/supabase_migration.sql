-- ================================================================
-- DUWAZ — FULL DATABASE MIGRATION
-- Run this in: Supabase Dashboard → SQL Editor → New query → RUN
-- Every statement uses IF NOT EXISTS / IF EXISTS so it's safe
-- to run multiple times without errors.
-- ================================================================


-- ──────────────────────────────────────────────────────────────
-- TABLE: student
-- New columns: email, password, role
-- ──────────────────────────────────────────────────────────────
ALTER TABLE student
    ADD COLUMN IF NOT EXISTS email          VARCHAR(255),
    ADD COLUMN IF NOT EXISTS password       VARCHAR(255),
    ADD COLUMN IF NOT EXISTS role           VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER';

-- email must be unique (only add constraint if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'student_email_key' AND conrelid = 'student'::regclass
    ) THEN
        ALTER TABLE student ADD CONSTRAINT student_email_key UNIQUE (email);
    END IF;
END $$;


-- ──────────────────────────────────────────────────────────────
-- TABLE: business
-- New columns: logo_url, student_id (FK to student)
-- ──────────────────────────────────────────────────────────────
ALTER TABLE business
    ADD COLUMN IF NOT EXISTS logo_url       TEXT,
    ADD COLUMN IF NOT EXISTS student_id     BIGINT REFERENCES student(id);


-- ──────────────────────────────────────────────────────────────
-- TABLE: product
-- New columns: image_url, stock_quantity, product_status, business_id
-- ──────────────────────────────────────────────────────────────
ALTER TABLE product
    ADD COLUMN IF NOT EXISTS image_url      TEXT,
    ADD COLUMN IF NOT EXISTS stock_quantity INTEGER     NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS product_status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    ADD COLUMN IF NOT EXISTS business_id    BIGINT REFERENCES business(id);


-- ──────────────────────────────────────────────────────────────
-- TABLE: delivery_drivers
-- New columns: password, status, is_active, profile_image, emergency_contact
-- Hibernate maps the entity to "delivery_drivers" with column "delivery_driver_id"
-- ──────────────────────────────────────────────────────────────
ALTER TABLE delivery_drivers
    ADD COLUMN IF NOT EXISTS password           VARCHAR(255),
    ADD COLUMN IF NOT EXISTS status             VARCHAR(20) NOT NULL DEFAULT 'OFFLINE',
    ADD COLUMN IF NOT EXISTS is_active          BOOLEAN     NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS profile_image      TEXT,
    ADD COLUMN IF NOT EXISTS emergency_contact  VARCHAR(255);


-- ──────────────────────────────────────────────────────────────
-- TABLE: store_messages
-- - Make business_id nullable (shop-less messages are valid)
-- - New columns: driver_id, message_type, status, subject,
--                reply_content, read_at, replied_at, from_admin
-- ──────────────────────────────────────────────────────────────

-- Drop NOT NULL on business_id if it exists
ALTER TABLE store_messages
    ALTER COLUMN business_id DROP NOT NULL;

ALTER TABLE store_messages
    ADD COLUMN IF NOT EXISTS driver_id      BIGINT      REFERENCES delivery_drivers(delivery_driver_id),
    ADD COLUMN IF NOT EXISTS order_id       BIGINT      REFERENCES orders(id),
    ADD COLUMN IF NOT EXISTS message_type   VARCHAR(30) NOT NULL DEFAULT 'MESSAGE',
    ADD COLUMN IF NOT EXISTS status         VARCHAR(20) NOT NULL DEFAULT 'UNREAD',
    ADD COLUMN IF NOT EXISTS subject        VARCHAR(255),
    ADD COLUMN IF NOT EXISTS reply_content  TEXT,
    ADD COLUMN IF NOT EXISTS read_at        TIMESTAMP,
    ADD COLUMN IF NOT EXISTS replied_at     TIMESTAMP,
    ADD COLUMN IF NOT EXISTS from_admin     BOOLEAN     NOT NULL DEFAULT FALSE;

-- Rename "message" column to "content" if the old name exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'store_messages' AND column_name = 'message'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'store_messages' AND column_name = 'content'
    ) THEN
        ALTER TABLE store_messages RENAME COLUMN message TO content;
    END IF;
END $$;

-- Add content column if neither "message" nor "content" exist
ALTER TABLE store_messages
    ADD COLUMN IF NOT EXISTS content        TEXT;

-- sent_at must be NOT NULL with a default
ALTER TABLE store_messages
    ADD COLUMN IF NOT EXISTS sent_at        TIMESTAMP NOT NULL DEFAULT NOW();


-- ──────────────────────────────────────────────────────────────
-- TABLE: delivery_assignments
-- New columns: delivery_status, accepted_at, picked_up_at,
--              delivered_at, delivery_notes, failure_reason,
--              proof_of_delivery, otp_code, otp_verified
-- ──────────────────────────────────────────────────────────────
ALTER TABLE delivery_assignments
    ADD COLUMN IF NOT EXISTS delivery_status    VARCHAR(30) NOT NULL DEFAULT 'ASSIGNED',
    ADD COLUMN IF NOT EXISTS assigned_at        TIMESTAMP   NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS accepted_at        TIMESTAMP,
    ADD COLUMN IF NOT EXISTS picked_up_at       TIMESTAMP,
    ADD COLUMN IF NOT EXISTS delivered_at       TIMESTAMP,
    ADD COLUMN IF NOT EXISTS delivery_notes     TEXT,
    ADD COLUMN IF NOT EXISTS failure_reason     VARCHAR(255),
    ADD COLUMN IF NOT EXISTS proof_of_delivery  TEXT,
    ADD COLUMN IF NOT EXISTS otp_code           VARCHAR(10),
    ADD COLUMN IF NOT EXISTS otp_verified       BOOLEAN     NOT NULL DEFAULT FALSE;


-- ──────────────────────────────────────────────────────────────
-- TABLE: orders
-- New columns: delivery_address, cancellation_reason, status,
--              order_date, total_amount, business_id, student_id
-- ──────────────────────────────────────────────────────────────
ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS delivery_address   VARCHAR(255),
    ADD COLUMN IF NOT EXISTS cancellation_reason VARCHAR(255),
    ADD COLUMN IF NOT EXISTS status             VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    ADD COLUMN IF NOT EXISTS order_date         TIMESTAMP   NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS total_amount       NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS business_id        BIGINT      REFERENCES business(id),
    ADD COLUMN IF NOT EXISTS student_id         BIGINT      REFERENCES student(id);


-- ──────────────────────────────────────────────────────────────
-- TABLE: order_items
-- New columns: unit_price, quantity, product_id, order_id
-- ──────────────────────────────────────────────────────────────
ALTER TABLE order_items
    ADD COLUMN IF NOT EXISTS unit_price     NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS quantity       INTEGER,
    ADD COLUMN IF NOT EXISTS product_id     BIGINT REFERENCES product(id),
    ADD COLUMN IF NOT EXISTS order_id       BIGINT REFERENCES orders(id);


-- ──────────────────────────────────────────────────────────────
-- TABLE: transactions
-- Verify required columns exist
-- ──────────────────────────────────────────────────────────────
ALTER TABLE transactions
    ADD COLUMN IF NOT EXISTS transaction_amount  NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS transaction_date    TIMESTAMP   NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS transaction_status  VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    ADD COLUMN IF NOT EXISTS user_id             BIGINT      REFERENCES student(id),
    ADD COLUMN IF NOT EXISTS product_id          BIGINT      REFERENCES product(id);


-- ──────────────────────────────────────────────────────────────
-- VERIFY: Run this query after to confirm all tables look right
-- ──────────────────────────────────────────────────────────────
-- SELECT table_name, column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name IN (
--       'student','business','product','delivery_drivers',
--       'store_messages','delivery_assignments','orders',
--       'order_items','transactions'
--   )
-- ORDER BY table_name, ordinal_position;

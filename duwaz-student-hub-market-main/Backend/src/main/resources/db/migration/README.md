# Database migrations

Schema changes go here from now on — `spring.jpa.hibernate.ddl-auto` is `none`,
so Hibernate no longer touches the schema on boot.

The schema as it existed when Flyway was introduced (everything the old
`ddl-auto=update` had already built, including every table currently in the
live Supabase database) is the **baseline** — `spring.flyway.baseline-on-migrate=true`
marks it as version 0 without needing a script for it.

## Adding a migration

1. Add a new file: `V<next-number>__short_description.sql`
   (e.g. `V1__add_order_notes_column.sql`). Numbers must increase; don't reuse one.
2. Write plain SQL for the change. For a new NOT NULL column on a table that
   already has rows, always give it a database-level default — Postgres will
   refuse `ALTER TABLE ... ADD COLUMN ... NOT NULL` with no default otherwise
   (this is exactly what broke when `points_redeemed` was added under the old
   `ddl-auto=update` setup — the ALTER failed at boot with existing order rows
   already in the table).
3. Never edit or delete a migration file that's already been applied anywhere
   (locally, in prod) — Flyway checksums each one and refuses to start if a
   checksum doesn't match what it recorded. Add a new migration to fix a mistake
   instead.
4. Test it locally (`./mvnw spring-boot:run`) before committing — Flyway runs
   automatically on startup and the app won't boot if a migration fails.

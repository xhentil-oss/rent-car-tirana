require('dotenv').config();
const mysql = require('mysql2/promise');

// Each table as a separate statement — if one fails we still continue others
const TABLES = [
  // USERS
  `CREATE TABLE IF NOT EXISTS users (
    id          CHAR(36) NOT NULL,
    email       VARCHAR(255) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,
    name        VARCHAR(255) NOT NULL,
    role        ENUM('admin','manager','staff','accountant') DEFAULT 'staff',
    is_active   TINYINT(1) DEFAULT 1,
    two_factor_enabled TINYINT(1) DEFAULT 0,
    permissions TEXT DEFAULT '',
    profile_picture_url VARCHAR(512),
    last_login  DATETIME,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // REFRESH TOKENS
  `CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          CHAR(36) NOT NULL,
    user_id     CHAR(36) NOT NULL,
    token       VARCHAR(512) NOT NULL UNIQUE,
    expires_at  DATETIME NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // PASSWORD RESET TOKENS
  `CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id          CHAR(36) NOT NULL,
    user_id     CHAR(36) NOT NULL,
    token       VARCHAR(255) NOT NULL UNIQUE,
    expires_at  DATETIME NOT NULL,
    used        TINYINT(1) DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // CARS
  `CREATE TABLE IF NOT EXISTS cars (
    id              CHAR(36) NOT NULL,
    brand           VARCHAR(100) NOT NULL,
    model           VARCHAR(100) NOT NULL,
    year            SMALLINT NOT NULL,
    category        VARCHAR(50) NOT NULL,
    transmission    VARCHAR(20) NOT NULL DEFAULT 'Manual',
    fuel            VARCHAR(20) NOT NULL DEFAULT 'Benzine',
    seats           TINYINT NOT NULL DEFAULT 5,
    luggage         TINYINT NOT NULL DEFAULT 2,
    price_per_day   DECIMAL(10,2) NOT NULL,
    status          VARCHAR(30) NOT NULL DEFAULT 'Available',
    image           TEXT,
    slug            VARCHAR(255) UNIQUE NOT NULL,
    featured        TINYINT(1) DEFAULT 0,
    created_by      CHAR(36),
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // CUSTOMERS
  `CREATE TABLE IF NOT EXISTS customers (
    id          CHAR(36) NOT NULL,
    name        VARCHAR(255) NOT NULL,
    first_name  VARCHAR(100),
    last_name   VARCHAR(100),
    email       VARCHAR(255) UNIQUE NOT NULL,
    phone       VARCHAR(30) NOT NULL,
    type        VARCHAR(30) DEFAULT 'Standard',
    created_by  CHAR(36),
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // RESERVATIONS
  `CREATE TABLE IF NOT EXISTS reservations (
    id                CHAR(36) NOT NULL,
    car_id            CHAR(36) NOT NULL,
    customer_id       CHAR(36) NOT NULL,
    pickup_location   VARCHAR(255) NOT NULL,
    dropoff_location  VARCHAR(255) NOT NULL,
    start_date        DATE NOT NULL,
    start_time        VARCHAR(10) NOT NULL,
    end_date          DATE NOT NULL,
    end_time          VARCHAR(10) NOT NULL,
    notes             TEXT,
    source            VARCHAR(30) DEFAULT 'Web',
    status            VARCHAR(30) DEFAULT 'Pending',
    total_price       DECIMAL(10,2) NOT NULL,
    insurance         VARCHAR(50),
    extras            TEXT DEFAULT '',
    discount_code     VARCHAR(50),
    payment_status    VARCHAR(30) DEFAULT 'Pending Payment',
    created_by        CHAR(36),
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE RESTRICT,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // INVOICES
  `CREATE TABLE IF NOT EXISTS invoices (
    id              CHAR(36) NOT NULL,
    invoice_no      VARCHAR(50) UNIQUE NOT NULL,
    reservation_id  CHAR(36) NOT NULL,
    amount          DECIMAL(10,2) NOT NULL,
    status          VARCHAR(30) DEFAULT 'Pa paguar',
    due_date        DATE NOT NULL,
    paid_at         DATETIME,
    created_by      CHAR(36),
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // DEPOSITS
  `CREATE TABLE IF NOT EXISTS deposits (
    id              CHAR(36) NOT NULL,
    reservation_id  CHAR(36) NOT NULL,
    customer_id     CHAR(36) NOT NULL,
    amount          DECIMAL(10,2) NOT NULL,
    paid_date       DATE NOT NULL,
    return_date     DATE,
    status          VARCHAR(30) DEFAULT 'Mbajtur',
    note            TEXT,
    created_by      CHAR(36),
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE RESTRICT,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // CUSTOMER DOCUMENTS
  `CREATE TABLE IF NOT EXISTS customer_documents (
    id              CHAR(36) NOT NULL,
    customer_id     CHAR(36) NOT NULL,
    document_type   VARCHAR(30) NOT NULL,
    file_url        VARCHAR(512) NOT NULL,
    expiry_date     DATE,
    created_by      CHAR(36),
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // COMMUNICATION LOGS
  `CREATE TABLE IF NOT EXISTS communication_logs (
    id            CHAR(36) NOT NULL,
    customer_id   CHAR(36) NOT NULL,
    type          VARCHAR(20) NOT NULL,
    subject       VARCHAR(255) NOT NULL,
    content       TEXT NOT NULL,
    timestamp     DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by    CHAR(36),
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // CHAT MESSAGES
  `CREATE TABLE IF NOT EXISTS chat_messages (
    id                CHAR(36) NOT NULL,
    conversation_id   VARCHAR(100) NOT NULL,
    text              TEXT NOT NULL,
    is_from_admin     TINYINT(1) DEFAULT 0,
    created_by        CHAR(36),
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_conversation (conversation_id),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // ACTIVITY LOGS
  `CREATE TABLE IF NOT EXISTS activity_logs (
    id          CHAR(36) NOT NULL,
    user_id     CHAR(36),
    action      VARCHAR(30) NOT NULL,
    entity      VARCHAR(50) NOT NULL,
    entity_id   CHAR(36),
    description TEXT NOT NULL,
    ip_address  VARCHAR(50),
    timestamp   DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // MAINTENANCE RECORDS
  `CREATE TABLE IF NOT EXISTS maintenance_records (
    id                    CHAR(36) NOT NULL,
    car_id                CHAR(36) NOT NULL,
    type                  VARCHAR(50) NOT NULL,
    status                VARCHAR(30) DEFAULT 'Scheduled',
    scheduled_date        DATE NOT NULL,
    completed_date        DATE,
    mileage_at_service    INT,
    next_service_mileage  INT,
    cost                  DECIMAL(10,2),
    notes                 TEXT,
    mechanic_name         VARCHAR(100),
    created_by            CHAR(36),
    created_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at            DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // INSURANCE RECORDS
  `CREATE TABLE IF NOT EXISTS insurance_records (
    id              CHAR(36) NOT NULL,
    car_id          CHAR(36) NOT NULL,
    provider        VARCHAR(100) NOT NULL,
    policy_number   VARCHAR(100) NOT NULL,
    start_date      DATE NOT NULL,
    expiry_date     DATE NOT NULL,
    cost            DECIMAL(10,2) NOT NULL,
    type            VARCHAR(30) NOT NULL,
    status          VARCHAR(30) DEFAULT 'Active',
    created_by      CHAR(36),
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // REGISTRATION RECORDS
  `CREATE TABLE IF NOT EXISTS registration_records (
    id              CHAR(36) NOT NULL,
    car_id          CHAR(36) NOT NULL,
    plate_number    VARCHAR(20) NOT NULL,
    expiry_date     DATE NOT NULL,
    renewal_cost    DECIMAL(10,2),
    status          VARCHAR(30) DEFAULT 'Valid',
    notes           TEXT,
    created_by      CHAR(36),
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // FUEL LOGS
  `CREATE TABLE IF NOT EXISTS fuel_logs (
    id              CHAR(36) NOT NULL,
    car_id          CHAR(36) NOT NULL,
    date            DATE NOT NULL,
    liters          DECIMAL(8,2) NOT NULL,
    price_per_liter DECIMAL(8,3) NOT NULL,
    total_cost      DECIMAL(10,2) NOT NULL,
    mileage         INT NOT NULL,
    fuel_type       VARCHAR(20) NOT NULL,
    station         VARCHAR(100),
    notes           TEXT,
    created_by      CHAR(36),
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // DAMAGE REPORTS
  `CREATE TABLE IF NOT EXISTS damage_reports (
    id              CHAR(36) NOT NULL,
    car_id          CHAR(36) NOT NULL,
    reservation_id  CHAR(36),
    report_date     DATE NOT NULL,
    description     TEXT NOT NULL,
    severity        VARCHAR(30) NOT NULL,
    status          VARCHAR(30) DEFAULT 'Reported',
    repair_cost     DECIMAL(10,2),
    photo_urls      TEXT DEFAULT '',
    reported_by     VARCHAR(100) NOT NULL,
    notes           TEXT,
    created_by      CHAR(36),
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE,
    FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // REVIEWS
  `CREATE TABLE IF NOT EXISTS reviews (
    id          CHAR(36) NOT NULL,
    rating      TINYINT NOT NULL,
    text        TEXT NOT NULL,
    author_name VARCHAR(100) NOT NULL,
    aspects     TEXT,
    approved    TINYINT(1) DEFAULT 0,
    created_by  CHAR(36),
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // CHANGELOG ENTRIES
  `CREATE TABLE IF NOT EXISTS changelog_entries (
    id            CHAR(36) NOT NULL,
    title         VARCHAR(255) NOT NULL,
    content       TEXT NOT NULL,
    version       VARCHAR(20),
    release_date  DATE,
    is_published  TINYINT(1) DEFAULT 0,
    created_by    CHAR(36),
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // PRICING RULES
  `CREATE TABLE IF NOT EXISTS pricing_rules (
    id                    CHAR(36) NOT NULL,
    name                  VARCHAR(255) NOT NULL,
    type                  VARCHAR(30) NOT NULL,
    discount_type         VARCHAR(20) NOT NULL,
    discount_value        DECIMAL(8,2) NOT NULL,
    start_date            DATE NOT NULL,
    end_date              DATE NOT NULL,
    min_days              INT,
    max_days              INT,
    advance_booking_days  INT,
    last_minute_hours     INT,
    promo_code            VARCHAR(50),
    applicable_to         VARCHAR(100) DEFAULT 'all',
    is_active             TINYINT(1) DEFAULT 1,
    priority              TINYINT DEFAULT 0,
    description           TEXT,
    usage_count           INT DEFAULT 0,
    max_usages            INT DEFAULT 0,
    created_by            CHAR(36),
    created_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at            DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
];

async function migrate() {
  const connection = await mysql.createConnection({
    host:     process.env.DB_HOST || 'localhost',
    port:     Number(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset:  'utf8mb4',
  });

  console.log('🚀 Running migrations...');
  let success = 0;
  let failed = 0;

  for (const sql of TABLES) {
    // Extract table name for logging
    const match = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/i);
    const tableName = match ? match[1] : 'unknown';
    try {
      await connection.query(sql);
      console.log(`  ✅ ${tableName}`);
      success++;
    } catch (err) {
      console.error(`  ❌ ${tableName}: ${err.message}`);
      failed++;
    }
  }

  await connection.end();
  console.log(`\n📊 Migration complete: ${success} OK, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

migrate();

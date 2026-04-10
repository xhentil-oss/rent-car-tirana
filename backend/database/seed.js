require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const pool = require('./db');

async function seed() {
  console.log('🌱 Seeding database...');

  // Admin user
  const adminId = uuidv4();
  const hash = await bcrypt.hash('Admin@1234', 12);
  await pool.query(
    'INSERT IGNORE INTO users (id, email, name, password, role, is_active, permissions) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [adminId, 'admin@rentalalb.com', 'Admin RentalALB', hash, 'admin', 1, 'cars.view,cars.edit,reservations.view,reservations.edit,customers.view,finance.view']
  );
  console.log('✅ Admin user: admin@rentalalb.com / Admin@1234');

  console.log('🎉 Seed complete!');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });

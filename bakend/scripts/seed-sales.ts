import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()
const connectionString = process.argv[2] ?? process.env.DATABASE_URL

if (!connectionString) {
  console.error('Provide Neon/Postgres URL as arg or DATABASE_URL env var.')
  process.exit(1)
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
})

const customers = [
  'Acme Retail',
  'Bluekart',
  'Nexa Stores',
  'Urban Basket',
  'Fresh Mart',
  'Prime Outlet'
]

const salesRows = [
  ['Acme Retail', 12999.5, '2026-04-15T10:05:00Z'],
  ['Bluekart', 8200.0, '2026-04-15T12:22:00Z'],
  ['Nexa Stores', 15670.75, '2026-04-15T15:40:00Z'],
  ['Urban Basket', 4680.0, '2026-04-16T09:10:00Z'],
  ['Fresh Mart', 9930.2, '2026-04-16T11:31:00Z'],
  ['Prime Outlet', 7420.0, '2026-04-16T17:55:00Z'],
  ['Acme Retail', 18200.0, '2026-04-17T08:19:00Z'],
  ['Bluekart', 5350.0, '2026-04-17T13:03:00Z'],
  ['Nexa Stores', 22440.9, '2026-04-17T16:44:00Z'],
  ['Urban Basket', 6100.0, '2026-04-18T10:12:00Z'],
  ['Fresh Mart', 14320.4, '2026-04-18T12:26:00Z'],
  ['Prime Outlet', 8775.3, '2026-04-18T18:01:00Z']
]

async function seed() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE
      );
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS sales (
        id SERIAL PRIMARY KEY,
        customer_id INT NOT NULL REFERENCES customers(id),
        amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `)

    for (const name of customers) {
      await client.query('INSERT INTO customers(name) VALUES($1) ON CONFLICT(name) DO NOTHING', [name])
    }

    for (const [name, amount, createdAt] of salesRows) {
      await client.query(
        `
        INSERT INTO sales (customer_id, amount, created_at)
        SELECT c.id, $2::numeric, $3::timestamptz
        FROM customers c
        WHERE c.name = $1
      `,
        [name, amount, createdAt]
      )
    }

    await client.query('COMMIT')

    const totalResult = await client.query(
      'SELECT COUNT(*)::int AS sales_count, COALESCE(SUM(amount),0)::numeric(12,2) AS total_sales FROM sales'
    )
    console.log('Seed complete:', totalResult.rows[0])
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

seed().catch((error) => {
  console.error('Seed failed:', error)
  process.exit(1)
})

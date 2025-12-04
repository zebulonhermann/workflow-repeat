const { Pool } = require("pg")

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function runMigration() {
  const client = await pool.connect()

  try {
    console.log("Running migration...")

    // Create chats table
    await client.query(`
      CREATE TABLE IF NOT EXISTS chats (
        id TEXT PRIMARY KEY,
        title TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `)
    console.log("Created chats table")

    // Create messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        chat_id TEXT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `)
    console.log("Created messages table")

    // Create index
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id)
    `)
    console.log("Created index")

    console.log("Migration completed successfully!")
  } catch (error) {
    console.error("Migration failed:", error.message)
  } finally {
    client.release()
    await pool.end()
  }
}

runMigration()

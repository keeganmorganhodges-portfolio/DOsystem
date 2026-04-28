-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user' CHECK(role IN ('user', 'moderator', 'admin')),
    avatar_url TEXT,
    is_verified INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Messages Table (Long-term Persistence)
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'text',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Relationships (Friends)
CREATE TABLE IF NOT EXISTS friendships (
    user_id_1 TEXT NOT NULL,
    user_id_2 TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'blocked')),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(user_id_1, user_id_2),
    FOREIGN KEY(user_id_1) REFERENCES users(id),
    FOREIGN KEY(user_id_2) REFERENCES users(id)
);

-- Moderation (Bans/Mutes)
CREATE TABLE IF NOT EXISTS moderation_logs (
    id TEXT PRIMARY KEY,
    target_user_id TEXT NOT NULL,
    actor_user_id TEXT NOT NULL,
    action TEXT CHECK(action IN ('mute', 'ban', 'kick', 'delete_message')),
    reason TEXT,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(target_user_id) REFERENCES users(id),
    FOREIGN KEY(actor_user_id) REFERENCES users(id)
);

-- Create Indexes for fast message retrieval
CREATE INDEX IF NOT EXISTS idx_messages_room ON messages(room_id, created_at);

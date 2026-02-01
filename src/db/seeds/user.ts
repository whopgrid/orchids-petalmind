import { db } from '@/db';
import { user, session } from '@/db/schema';

async function main() {
    const currentTimestamp = new Date();

    const sampleUsers = [
        {
            id: 'user_test_001',
            name: 'Test User One',
            email: 'testuser1@example.com',
            emailVerified: false,
            image: null,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            id: 'user_test_002',
            name: 'Test User Two',
            email: 'testuser2@example.com',
            emailVerified: true,
            image: 'https://i.pravatar.cc/150?u=testuser2',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        }
    ];

    await db.insert(user).values(sampleUsers);

    // Create session token for user_test_001
    const sessionToken = `session_token_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now

    await db.insert(session).values({
        id: `session_${Date.now()}`,
        token: sessionToken,
        userId: 'user_test_001',
        expiresAt: expiresAt,
        createdAt: currentTimestamp,
        updatedAt: currentTimestamp,
        ipAddress: '127.0.0.1',
        userAgent: 'Test API Client',
    });

    console.log('✅ Users seeder completed successfully');
    console.log('🔑 Session token for user_test_001:', sessionToken);
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});
import setupTestDatabase from "../../scripts/setup-test-db";
import cleanupTestDatabase from "../../scripts/cleanup-test-db";

export default async function globalSetup() {
    await setupTestDatabase();

    return async () => {
        await cleanupTestDatabase();
    };
}
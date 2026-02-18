const { MongoClient } = require('mongodb');

// Source Database (Old)
const sourceUri = "mongodb+srv://xappeesoftware:LMph7vvVk1gvgSMU@xappeedb.qd91bec.mongodb.net/?retryWrites=true&w=majority";
const sourceDbName = "test"; // It was showing 'test' or named after the cluster? Usually 'test' if not specified.

// Destination Database (New)
const destUri = "mongodb+srv://Vercel-Admin-atlas-copper-island:HzPoEfhtWQxtfR9n@atlas-copper-island.49xhepl.mongodb.net/?retryWrites=true&w=majority";
const destDbName = "test";

async function migrate() {
    const sourceClient = new MongoClient(sourceUri);
    const destClient = new MongoClient(destUri);

    try {
        await sourceClient.connect();
        await destClient.connect();
        console.log("Connected to both databases");

        const sourceDb = sourceClient.db(sourceDbName);
        const destDb = destClient.db(destDbName);

        const collections = await sourceDb.listCollections().toArray();
        console.log(`Found ${collections.length} collections to migrate`);

        for (const collectionInfo of collections) {
            const collectionName = collectionInfo.name;
            console.log(`Migrating collection: ${collectionName}...`);

            const data = await sourceDb.collection(collectionName).find({}).toArray();
            
            if (data.length > 0) {
                // Clear destination collection first to avoid duplicates
                await destDb.collection(collectionName).deleteMany({});
                await destDb.collection(collectionName).insertMany(data);
                console.log(`  - Successfully migrated ${data.length} documents.`);
            } else {
                console.log(`  - Collection is empty, skipping.`);
            }
        }

        console.log("\nMigration completed successfully! 🎉");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await sourceClient.close();
        await destClient.close();
    }
}

migrate();

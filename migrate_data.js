const { MongoClient } = require('mongodb');

// Source Database (Old) - Using Standard Format to bypass DNS SRV issues
// Note: Derived shard addresses for qd91bec cluster
const sourceUri = "mongodb://xappeesoftware:LMph7vvVk1gvgSMU@ac-qd91bec-shard-00-00.qd91bec.mongodb.net:27017,ac-qd91bec-shard-00-01.qd91bec.mongodb.net:27017,ac-qd91bec-shard-00-02.qd91bec.mongodb.net:27017/?ssl=true&replicaSet=atlas-qd91bec-shard-0&authSource=admin&retryWrites=true&w=majority";

// Destination Database (New) - Using Standard Format
// Note: Derived shard addresses for 49xhepl cluster
const destUri = "mongodb://Vercel-Admin-atlas-copper-island:HzPoEfhtWQxtfR9n@ac-h64gv9n-shard-00-00.49xhepl.mongodb.net:27017,ac-h64gv9n-shard-00-01.49xhepl.mongodb.net:27017,ac-h64gv9n-shard-00-02.49xhepl.mongodb.net:27017/?ssl=true&replicaSet=atlas-h64gv9n-shard-0&authSource=admin&retryWrites=true&w=majority";

async function migrate() {
    const sourceClient = new MongoClient(sourceUri);
    const destClient = new MongoClient(destUri);

    try {
        console.log("Attempting to connect to Source...");
        await sourceClient.connect();
        console.log("Connected to Source Database ✅");

        console.log("Attempting to connect to Destination...");
        await destClient.connect();
        console.log("Connected to Destination Database ✅");

        const sourceDb = sourceClient.db("test"); // Double check if it's 'test' or another name
        const destDb = destClient.db("test");

        const collections = await sourceDb.listCollections().toArray();
        console.log(`\nFound ${collections.length} collections to migrate:`);

        for (const collectionInfo of collections) {
            const collectionName = collectionInfo.name;
            process.stdout.write(`Migrating [${collectionName}]... `);

            const data = await sourceDb.collection(collectionName).find({}).toArray();
            
            if (data.length > 0) {
                // Clear destination collection first to avoid duplicates
                await destDb.collection(collectionName).deleteMany({});
                await destDb.collection(collectionName).insertMany(data);
                console.log(`Done (${data.length} docs)`);
            } else {
                console.log(`Skipped (Empty)`);
            }
        }

        console.log("\nMigration completed successfully! 🎉");
        console.log("Please check your application now.");
    } catch (err) {
        console.error("\nMigration failed ❌");
        console.error("Error Detail:", err.message);
        if (err.message.includes("ETIMEOUT") || err.message.includes("ECONNREFUSED")) {
            console.log("\nTIP: Make sure your local IP is whitelisted in BOTH MongoDB clusters (Old and New).");
        }
    } finally {
        await sourceClient.close();
        await destClient.close();
    }
}

migrate();

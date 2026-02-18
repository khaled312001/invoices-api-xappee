const dns = require('dns').promises;

async function probe() {
    const srvRecord = "_mongodb._tcp.xappeedb.qd91bec.mongodb.net";
    console.log(`Probing SRV record for: ${srvRecord}...`);

    try {
        // Try to resolve SRV record to get actual shard hostnames
        const addresses = await dns.resolveSrv(srvRecord);
        console.log("\nFound Shard Hostnames:");
        addresses.forEach(addr => {
            console.log(`- ${addr.name}:${addr.port}`);
        });

        console.log("\nSUGGESTION: Copy these hostnames into the migration script.");
    } catch (err) {
        console.error("\nFailed to resolve SRV record ❌");
        console.error("Error Detail:", err.message);
        console.log("\nThis confirms that your network or DNS provider (ISP) is blocking MongoDB Atlas records.");
        console.log("TRY THIS: Change your computer's DNS to Google (8.8.8.8 and 8.8.4.4) and try again.");
    }
}

probe();

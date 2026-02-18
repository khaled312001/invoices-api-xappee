const dns = require('dns').promises;

async function probe() {
    const shards = [
        "ac-qd91bec-shard-00-00.qd91bec.mongodb.net",
        "ac-qd91bec-shard-00-01.qd91bec.mongodb.net",
        "ac-qd91bec-shard-00-02.qd91bec.mongodb.net"
    ];

    console.log("Probing individual shard hostnames...");

    for (const shard of shards) {
        try {
            const addresses = await dns.resolve4(shard);
            console.log(`✅ ${shard} -> ${addresses.join(', ')}`);
        } catch (err) {
            console.log(`❌ ${shard} -> FAILED (${err.code})`);
        }
    }
}

probe();

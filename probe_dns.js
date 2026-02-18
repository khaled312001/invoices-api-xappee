const dns = require('dns');
const dnsPromises = dns.promises;

// Force use of Google DNS to bypass local ISP blocks
dns.setServers(['8.8.8.8', '8.8.4.4']);

async function probe() {
    const srvRecord = "_mongodb._tcp.xappeedb.qd91bec.mongodb.net";
    console.log(`Probing SRV record using Google DNS (8.8.8.8) for: ${srvRecord}...`);

    try {
        const addresses = await dnsPromises.resolveSrv(srvRecord);
        console.log("\n✅ Found Shard Hostnames:");
        addresses.forEach(addr => {
            console.log(`- ${addr.name}:${addr.port}`);
        });

        console.log("\nNext Step: Run the migration script again. I will update it with these hostnames if you provide them.");
    } catch (err) {
        console.error("\n❌ Failed to resolve SRV record even with Google DNS.");
        console.error("Error Detail:", err.message);
        console.log("\nYour network might be transparently intercepting DNS or using a firewall that blocks ALL Atlas traffic.");
        console.log("SUGGESTION: Please try connecting your computer to a mobile hotspot or use a VPN, then run this script again.");
    }
}

probe();

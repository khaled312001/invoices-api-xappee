const https = require('https');

const hostnames = [
    "ac-qd91bec-shard-00-00.qd91bec.mongodb.net",
    "ac-qd91bec-shard-00-01.qd91bec.mongodb.net",
    "ac-qd91bec-shard-00-02.qd91bec.mongodb.net"
];

async function resolveDoH(hostname) {
    return new Promise((resolve, reject) => {
        // Using Cloudflare DNS-over-HTTPS
        const url = `https://cloudflare-dns.com/dns-query?name=${hostname}&type=A`;
        const options = {
            headers: { 'Accept': 'application/dns-json' }
        };

        https.get(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.Answer && json.Answer.length > 0) {
                        resolve(json.Answer.map(a => a.data));
                    } else {
                        resolve([]);
                    }
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

async function main() {
    console.log("Attempting resolution via Cloudflare DNS-over-HTTPS (bypassing ISP DNS)...");
    for (const host of hostnames) {
        try {
            const ips = await resolveDoH(host);
            if (ips.length > 0) {
                console.log(`✅ ${host} -> ${ips.join(', ')}`);
            } else {
                console.log(`❌ ${host} -> NO RECORD FOUND`);
            }
        } catch (err) {
            console.log(`❌ ${host} -> REQUEST FAILED (${err.message})`);
        }
    }
}

main();

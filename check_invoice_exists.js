const mongoose = require('mongoose');

const uri = "mongodb+srv://xappeesoftware:LMph7vvVk1gvgSMU@xappeedb.qd91bec.mongodb.net/?retryWrites=true&w=majority";

async function checkInvoice() {
    try {
        await mongoose.connect(uri);
        const StorageInvoice = mongoose.model('StorageInvoice', new mongoose.Schema({}, { strict: false }));
        
        const invoice = await StorageInvoice.findById("69f35856c65cca3f0d27b892").lean();
        if (invoice) {
            console.log("Invoice Found in DB. It was NOT deleted.");
        } else {
            console.log("Invoice NOT FOUND. It was deleted.");
        }
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkInvoice();

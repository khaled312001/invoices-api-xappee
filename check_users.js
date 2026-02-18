import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;

const userSchema = new mongoose.Schema({
    email: String,
    role: String,
    client: String,
    status: String
}, { collection: 'users' });

const User = mongoose.model('User', userSchema);

async function checkUsers() {
    try {
        await mongoose.connect(uri);
        console.log("Connected to MongoDB");
        
        const users = await User.find({}, 'email role client status');
        console.log("Users found:", JSON.stringify(users, null, 2));
        
        await mongoose.disconnect();
    } catch (err) {
        console.error("Error:", err);
    }
}

checkUsers();

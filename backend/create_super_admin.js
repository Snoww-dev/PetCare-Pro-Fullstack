import bcrypt from "bcryptjs";
import dotenv from "dotenv";

import { connectDB } from "./src/configs/database.js";
import User from "./src/models/user.model.js";

dotenv.config();

const createSuperAdmin = async () => {
    try {
        await connectDB();

        // tránh create trùng
        const existed = await User.findOne({
            $or: [
                { username: "admin" },
                { email: "admin@petcare.com" },
            ],
        });

        if (existed) {
            console.log("Admin user already exists");
            process.exit(0);
        }

        const password = await bcrypt.hash("Admin@123", 10);

        await User.create({
            username: "admin",
            password_hash: password,
            email: "admin@petcare.com",
            full_name: "Super Admin",
            phone: "1234567890",
            address: "123 Admin St, Admin City, Admin Country",
            is_active: true,
            last_login: new Date(),
        });

        console.log("Super admin user created successfully");
        process.exit(0);
    } catch (error) {
        console.error("Error creating super admin:", error);
        process.exit(1);
    }
};

createSuperAdmin();

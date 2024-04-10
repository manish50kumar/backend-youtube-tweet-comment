import mongoose from "mongoose";


const ConnectDB = async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URL}`);
        console.log("Database Connect successfully!!");
    }
    catch (error) {
        console.log("Error in connect to DataBase : ", error);
        process.exit(1);
    }
}

export default ConnectDB;
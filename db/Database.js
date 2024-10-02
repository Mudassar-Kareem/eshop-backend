const mongoose = require("mongoose");

const connectDatabase = () => {
    mongoose.connect(process.env.DB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }).then((data) => {
        console.log(`Mongoose connected with server: ${data.connection.host}`);
    }).catch((error) => {
        console.error('Error connecting to the database:', error);
    });
}

module.exports = connectDatabase;

const mongoose = require('mongoose')
const dbString = "mongodb+srv://knshivakumar139:G0S3YvOYZGSMqaLp@cluster0.ud5oc.mongodb.net/Shantha?retryWrites=true&w=majority&appName=Cluster0"

mongoose.connect(dbString);

const connection = mongoose.connection;

connection.on("connected", () => {
  console.log("Connection Successful");
});

connection.on("error", () => {
  console.log("Connection Unsuccessful");
});

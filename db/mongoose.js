const mongoose = require("mongoose");
// const url =
//   "mongodb+srv://sesna_btp:sesna_123@cluster0.xnijrxs.mongodb.net/sesna?retryWrites=true&w=majority";
// const connectionParams = {
// };
// mongoose.connect(url, connectionParams)
//   .then(() => {
//     console.log("Connection Successful");
//   })
//   .catch((err) => {
//     console.log("Connection Failed");
//   });
const connectionParams = {}
const connectDB = async () => {
  try{
    const conn = await mongoose.connect(process.env.MONGODB_URI,connectionParams)
    console.log("CONNECTION SUCCESSFUL")
  }catch(error){
    console.log("CONNECTION FAILED")
    console.log(error)
    process.exit();
  }
}

module.exports = connectDB

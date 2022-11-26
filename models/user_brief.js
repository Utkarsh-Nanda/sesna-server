const mongoose = require("mongoose");
const validator = require("validator");

const user_brief_schema = new mongoose.Schema({
  personal_detail: {
    name: { type: String, required: true, trim: true },
    //display_picture: {},
    user_id: {type: String, required: true}
  },
})

const User_brief = mongoose.model("User_brief", user_brief_schema );

module.exports = User_brief;

const mongoose = require("mongoose");
const validator = require("validator");

const community_brief_schema = new mongoose.Schema({
  community_name: { type: String, required: true },
  community_id: { type: String, required: true },
  //   community_dp: {},
  user_count: { type: Number, required: true },
  description: { type: String, required: true },
  creation_date: {
    type: String,
    required: true,
    trim: true,
    validate(value) {
      if (!validator.isDate(value)) {
        throw new Error("Date is invalid.");
      }
    },
  },
})

const Community_brief = mongoose.model("Community_brief", community_brief_schema);

module.exports = Community_brief;

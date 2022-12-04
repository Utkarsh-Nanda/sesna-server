const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

const user_schema = new mongoose.Schema({
  personal_detail: {
    name: { type: String, required: true, trim: true },
    phone: {
      type: String,
      required: true,
      trim: true,
      validate(value) {
        if (!validator.isMobilePhone(value)) {
          throw new Error("Mobile Number is invalid.");
        }
      },
    },
    location: {
      address: { type: String, trim: true },
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
    },
    dob: {
      type: String,
      required: true,
      trim: true,
      validate(value) {
        if (!validator.isDate(value)) {
          throw new Error("Date is invalid.");
        }
      },
    },
    email: {
      type: String,
      required: true,
      unique : true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Email is invalid");
        }
      },
    },
    password: {
      type: String,
      required: true,
    },
  display_picture : {type : Buffer ,  default : ''},
  cover_picture : {type : Buffer , default : ''},
  description : {type : String , default : "Hey there, I am using SESNA"}
  },
  is_admin: {
    type: Boolean,
    default : false
  },
  is_public: {
    type: Boolean,
    required: true,
  },
  friends: [{ name: { type: String }, friend_id: { type: String } }],
  joined_community: [{
      community_name : { type: String},
      community_id : { type: String} ,
      role : {type : String },
    }
  ],
  tokens:[
    {token:{type:String,required:true}}
  ]
})

user_schema.methods.toJSON = function () {
  const user = this
  const userObject = user.toObject()

  delete userObject.password
  delete userObject.tokens
  // delete userObject.personal_detail.cover_picture
  // delete userObject.personal_detail.display_picture

  return userObject
}

user_schema.methods.generate_authtoken = async function(){
  const user = this
  const token = jwt.sign({_id: user._id.toString()},'thisismynewcourse')

  user.tokens = user.tokens.concat({token})
  await user.save()
  
  return token
}

user_schema.statics.findbycredentials = async(email,password)=>{
  const user = await User.findOne({'personal_detail.email':email})
  if(!user)
  {
    //console.log("cannot find")
    throw new Error('Email not valid')
  }
  const is_match = await bcrypt.compare(password,user.personal_detail.password)
  if(!is_match){
    throw new Error('Password Not Correct')
  }
  return user
}

user_schema.pre('save', async function(next){
  const user = this

  if(user.isModified('personal_detail.password')){
    user.personal_detail.password=await bcrypt.hash(user.personal_detail.password,8)
  }

  next()
})

const User = mongoose.model("User", user_schema);

module.exports = User;

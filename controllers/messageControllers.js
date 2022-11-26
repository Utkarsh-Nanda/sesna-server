const asyncHandler = require("express-async-handler");
const Message = require("../models/messageModel");
const User = require("../models/user");
const Chat = require("../models/chatModel");

//@description     Get all Messages
//@route           GET /api/Message/:chatId
//@access          Protected
const allMessages = asyncHandler(async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender.personal_detail", "name email")
      .populate("chat");
    res.json(messages);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Create New Message
//@route           POST /api/Message/
//@access          Protected
const sendMessage = asyncHandler(async (req, res) => {
  const { content, chatId } = req.body;

  if (!content || !chatId) {
    console.log("Invalid data passed into request");
    return res.sendStatus(400);
  }

  var newMessage = {
    sender: req.user._id,
    content: content,
    chat: chatId,
  };

  try {
      console.log(newMessage);
    var message = await Message.create(newMessage);

    message = await message.populate("sender");
    message = await message.populate("chat");
    message = await User.populate(message, {
      path: "chat.users.personal_detail",
      select: "name email",
    });
    console.log(message)
    await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message });
    console.log(message)
    console.log("tt")
    if (message != null)
      console.log("it is not null")
    if (message == null)
      console.log("it is null")
    res.json(message);
    console.log('hh')
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

module.exports = { allMessages, sendMessage };

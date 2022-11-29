const express = require('express')
const connectDB = require('./db/mongoose')
const dotenv = require("dotenv")
const path = require('path')
const cors = require('cors')

// models
const User = require('./models/user')
const User_brief = require('./models/user_brief')
const Community_brief = require('./models/community_brief')
const Community = require('./models/community')



// routers
const user_router = require('./routers/user')
const user_brief_router = require('./routers/user_brief')
const community_brief_router = require('./routers/community_brief')
const community_router = require('./routers/community')
const message_router = require('./routers/messageRoute')
const chat_router = require('./routers/chatRoute')

dotenv.config();
connectDB();

const __dirname1 = path.resolve();
// if (process.env.NODE_ENV === "production")
// {
//   app.use(express.static(path.join))
//   app.get('*', (req, res) => {
//     res.sendFile()
//   })
// }
// else
// {
//   app.get("/", (req, res) => {
//     res.send("API is Running Successfully");
//   });
// }

const app = express()
const port = process.env.PORT || 5000

const corsOptions ={
    origin:'http://localhost:3000', 
    credentials:true,            //access-control-allow-credentials:true
    optionSuccessStatus:200
}


app.use(express.json())
app.use(user_router)
app.use(user_brief_router)
app.use(community_brief_router)
app.use(community_router)
app.use("/chat", chat_router)
app.use("/message", message_router)

app.use(cors(corsOptions));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Max-Age", "1800");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "PUT, POST, GET, DELETE, PATCH, OPTIONS"
  );
  next();
});
app.use(cors());

const server = app.listen(port, () => {
    console.log('Server is up on port ' + port)
})
const io = require("socket.io")(server, {
    pingTimeout: 60000,
    cors: {
      origin: "http://localhost:3000",
      // credentials: true,
    },
  });
  
io.on("connection", (socket) => {
    console.log("Connected to socket.io");
    socket.on("setup", (userData) => {
      socket.join(userData._id);
      socket.emit("connected");
    });
  
    socket.on("join chat", (room) => {
      socket.join(room);
      console.log("User Joined Room: " + room);
    });
    socket.on("typing", (room) => socket.in(room).emit("typing"));
    socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));
  
    socket.on("new message", (newMessageRecieved) => {
      var chat = newMessageRecieved.chat;
  
      if (!chat.users) return console.log("chat.users not defined");
  
      chat.users.forEach((user) => {
        if (user._id == newMessageRecieved.sender._id) return;
  
        socket.in(user._id).emit("message recieved", newMessageRecieved);
      });
    });
  
    socket.off("setup", () => {
      console.log("USER DISCONNECTED");
      socket.leave(userData._id);
    });
  });
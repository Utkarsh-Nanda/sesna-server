const express = require('express')
const User = require('../models/user');
const User_brief = require('../models/user_brief');
const auth = require('../middleware/auth')
const router = new express.Router()
const multer = require('multer')
const sharp = require('sharp')
const Community = require('../models/community');

router.post('/user/signup',async(req,res)=>{
    try{
        const user= new User(req.body)
        const com1 = await Community.findById("6387c8ffd3f52f23627736f3")
        const com2 = await Community.findById("6387c915d3f52f23627736f7")
        const com3 = await Community.findById("6387c931d3f52f23627736fb")

        if(!com1 || !com2 || !com3)
        {
            throw new Error("Cannot find Major Communities")
        }

        await user.save()

        com1.community_brief.user_count = com1.members.length 
        com2.community_brief.user_count = com2.members.length 
        com3.community_brief.user_count = com3.members.length
        
        let details = {}
        details['user_name'] = req.body.personal_detail.name
        details['user_id'] = user._id.toHexString()
        details['role'] = "4"

        com1.members.push(details)
        com2.members.push(details)
        com3.members.push(details)

        let obj1 = {}
        let obj2 = {}
        let obj3 = {}

        obj1['community_name'] = com1.community_brief.community_name
        obj1['community_id'] = com1._id.toHexString()
        obj1['role'] = "4"

        obj2['community_name'] = com2.community_brief.community_name
        obj2['community_id'] = com2._id.toHexString()
        obj2['role'] = "4"

        obj3['community_name'] = com3.community_brief.community_name
        obj3['community_id'] = com3._id.toHexString()
        obj3['role'] = "4"


        user.joined_community.push(obj1)
        user.joined_community.push(obj2)
        user.joined_community.push(obj3)

        delete details.role
        com1.student_channel.push(details)
        com2.student_channel.push(details)
        com3.student_channel.push(details)

        await user.save()
        await com1.save()
        await com2.save()
        await com3.save()





        const token= await user.generate_authtoken()
        res.status(201).send({user,token})

        let brief_user=req.body;
        delete brief_user.tokens;
        delete brief_user.is_admin;
        delete brief_user.is_public;
        delete brief_user.personal_detail.dob;
        delete brief_user.personal_detail.phone;
        delete brief_user.personal_detail.location;
        delete brief_user.personal_detail.email;
        delete brief_user.personal_detail.password;
        brief_user.personal_detail['user_id']=user._id.toHexString();
        
        const user_brief = new User_brief(brief_user);
        await user_brief.save()
       // console.log("abcd")
        //res.send(user)
        // user_brief.save().then(()=>{
        //     console.log("saved");
        // }).catch((error)=>{
        //     res.status(400).send(error.message)
        // })
        //console.log("kkk")
    }
    catch(error)
    {
        //console.log("abc")
        //console.log(error)
        res.status(400).send(error.message)
    }
})

router.post('/user/login', async(req, res) => {
    try{
        const user=await User.findbycredentials(req.body.email,req.body.password)
        const token = await user.generate_authtoken()
        res.send({user , token})
    }catch(error)
    {
        //console.log(error.message)
        res.status(400)
        res.send(error.message)
    }
})

router.patch('user/change_description' , auth , async(req,res)=>{
    try{
        req.user.personal_detail.description = req.body.description
        await req.user.save()
    }catch(error)
    {
        //console.log(error.message)
        res.status(400)
        res.send(error.message)
    }
})

router.post('/user/logout', auth , async(req,res)=>{
    try{
        req.user.tokens = req.user.tokens.filter((token)=>{
            return token.token!=req.token
        })
        await req.user.save()
        res.send()
    }catch(error)
    {
        //console.log(error.message)
        res.status(400)
        res.send(error.message)
    }
})

router.post("/users/logoutall", auth , async(req,res)=>{
    try{
        req.user.tokens=[]
        await req.user.save()
        res.send()
    }catch(error)
    {
        //console.log(error.message)
        res.status(400)
        res.send(error.message)
    }
})


router.get('/users/me', auth , async(req,res)=>{
    try{
        res.send(req.user)
    }catch(error)
    {
        //console.log(error.message)
        res.status(400)
        res.send(error.message)
    }
    
})

router.patch('/make_admin', auth , async(req,res)=>{
    try{
        if(req.user.is_admin===true)
        {
            const user = await User.findById(req.body.id)
            user.is_admin = true
            await user.save()
            res.status(200).send(user)
        }
        else
        {
            throw new Error("User doesn't have authority to make admin")
        }
    }catch(error){
        res.status(400).send(error.message)
    }
})

router.patch('/remove_admin', auth , async(req,res)=>{
    try{
        if(req.user.is_admin===true)
        {
            const user = await User.findById(req.body.id)
            user.is_admin = false
            await user.save()
            res.status(200).send(user)
        }
        else
        {
            throw new Error("User doesn't have authority to make admin")
        }
    }catch(error){
        res.status(400).send(error.message)
    }
})

// router.get('/get_all_user', async(req, res) => {
//     try {
//         const user = await User.find({})
//         res.send(user)
//     } catch (e) {
//         res.status(500).send()
//     }
// })

const upload = multer ({
    limits :{
        fileSize : 5000000
    },
    fileFilter(req, file , cb){
        if(!file.originalname.match(/\.(jpg|jpeg|png|JPG)$/)){
            return cb(new Error('please upload an image'))
        }

        cb(undefined, true)
    }
})

router.post('/users/me/cover_picture', auth, upload.single('cover_picture'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
    req.user.personal_detail.cover_picture = buffer
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send(error.message)
})

router.delete('/users/me/cover_picture', auth, async (req, res) => {
    try{
        req.user.personal_detail.cover_picture = undefined
        await req.user.save()
        res.send()
    }catch(error){
        res.status(400).send(error.message)
    }
})

router.post('/users/me/display_picture', auth, upload.single('display_picture'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
    req.user.personal_detail.display_picture = buffer

    req.user.joined_community.forEach(async(element)=>{
        // if(element.user_id === req.body.user_id)
        // {
        //     details['user_name'] = element.user_name
        //     details['user_id'] = element.user_id
        //     details['role'] = "4"
        //     details['user_dp']=Buffer.from(element.user_dp)
        //     check = 1
        // }
        const pos = element.role
        const com = await Community.findById(element.community_id)
        if(!com)
        {
            throw new Error("community not found")
        }
        if(pos === "4")
        {
            // console.log("abc")
            // com.student_channel.user_dp = buffer
            com.student_channel.forEach(async(pp)=>{
                if(pp.user_id === req.user._id.toHexString())
                {
                    pp.user_dp = buffer;
                }
            })
        }
        if(pos === "mentor")
        {
            com.mentor.forEach(async(pp)=>{
                if(pp.user_id === req.user._id.toHexString())
                {
                    pp.user_dp = buffer;
                }
            })
        }
        if(pos === "professional")
        {
            com.professional.forEach(async(pp)=>{
                if(pp.user_id === req.user._id.toHexString())
                {
                    pp.user_dp = buffer;
                }
            })
        }
        if(pos === "teacher")
        {
            com.teacher.forEach(async(pp)=>{
                if(pp.user_id === req.user._id.toHexString())
                {
                    pp.user_dp = buffer;
                }
            })
        }
        com.members.forEach(async(pp)=>{
            if(pp.user_id === req.user._id.toHexString())
            {
                pp.user_dp = buffer;
            }
        })
        await com.save()
    })
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

router.delete('/users/me/display_picture', auth, async (req, res) => {
   try{
        req.user.personal_detail.display_picture = undefined
        await req.user.save()
        res.send()
   }catch(error){
    res.status(400).send(error.message)
}
})

router.get('/users/:id/display_picture', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)

        if (!user || !user.personal_detail.display_picture) {
            throw new Error()
        }

        res.set('Content-Type', 'image/png')
        res.send(user.personal_detail.display_picture)
    } catch(error){
        res.status(400).send(error.message)
    }
})

router.get('/users/:id/cover_picture', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)

        if (!user || !user.personal_detail.cover_picture) {
            throw new Error()
        }

        res.set('Content-Type', 'image/png')
        res.send(user.personal_detail.cover_picture)
    } catch(error){
        res.status(400).send(error.message)
    }
})

module.exports = router
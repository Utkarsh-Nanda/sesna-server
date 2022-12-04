const express = require('express');
const moment = require('moment');
const Community = require('../models/community');
const Community_brief = require('../models/community_brief');
const multer = require('multer');
const sharp = require('sharp');
const auth = require('../middleware/auth')
const User = require('../models/user')
const router = new express.Router()


router.post('/create_community' , async(req, res) => {
    const community = new Community(req.body)

    const time = community._id.getTimestamp()
    const tt=moment(time).format('l')

    community.save().then(()=>{
        res.send(community)

    }).catch((error)=>{
        res.status(404)
        res.send(error);
    })

    var creation_date = ''
    creation_date+=tt[6]
    creation_date+=tt[7]
    creation_date+=tt[8]
    creation_date+=tt[9]
    creation_date+='/'
    creation_date+=tt[0]
    creation_date+=tt[1]
    creation_date+='/'
    creation_date+=tt[3]
    creation_date+=tt[4]

    let obj = req.body.community_brief
    obj['creation_date']=creation_date.toString();
    obj['community_id']=community._id.toHexString();

    //console.log(obj);

    const community_brief= new Community_brief(obj)

    community_brief.save().then(()=>{
        console.log("saved");
    }).catch((error)=>{
        res.status(404)
        res.send(error.message)
    })
})

// router.get('/get_all_community', async(req, res) => {
//     try {
//         const community = await Community.find({})
//         res.send(community)
//     } catch (e) {
//         res.status(500).send()
//     }
// })

router.get('/community_by_id' , async(req,res)=>{
    try{
        const community = await Community.findById(req.body.id)
        if(!community)
        {
            throw new Error("community not found")
        }
        res.send(community)
    }
    catch(error){
        res.status(400).send(error.message)
    }
})

router.post('/add_community_request' , auth , async(req,res)=>{
    try{
        
        const community = await Community.findById(req.body.id)
        if(!community)
        {
            throw new Error("community not found")
        }
        //console.log(community)
       // console.log(req.user)
        
        const dp = Buffer.from((req.user).personal_detail.display_picture)
        //console.log(dp)
        

        let user_detail = {}

        user_detail['user_name']=req.user.personal_detail.name;
        user_detail['user_id']=req.user._id.toHexString();
        user_detail['user_dp']=dp;
        community.requests.push(user_detail)
        await community.save();
        res.send(community);
        
    }catch(error){
        console.log("a")
        res.status(400).send(error.message)
    }
})

router.patch('/decline_request', async(req,res) =>{
    try{
        const community = await Community.findById(req.body.id)
        if(!community)
        {
            // return res.status(401).send({error : 'No community found'})
            throw new Error("community not found")
        }
        community.requests = community.requests.filter((user_id)=>{
            return user_id.user_id!=req.body.user_id;
        })
        await community.save()
        res.send(community.requests)
        
    }catch(error){
        res.status(400).send(error.message)
    }
})

router.patch('/accept_request' , async(req,res)=>{
    try{
        const community = await Community.findById(req.body.id)
        if(!community)
        {
            throw new Error("community not found")
        }
        const user = await User.findById(req.body.user_id)
        if(!user)
        {
            throw new Error("user not found")
        }
        let details = {}
        let check = 0
        community.requests.forEach((element)=>{
            if(element.user_id === req.body.user_id)
            {
                details['user_name'] = element.user_name
                details['user_id'] = element.user_id
                details['role'] = "4"
                details['user_dp']=Buffer.from(element.user_dp)
                check = 1
            }
        })
        if(check===0)
        {
            throw new Error("No user found")
        }
        community.requests = community.requests.filter((user_id)=>{
            return user_id.user_id!=req.body.user_id;
        })
        community.community_brief.user_count = community.members.length 
        community.members.push(details)
        delete details.role
        community.student_channel.push(details)
        await community.save()

        let com = {}
        com['community_name'] = community.community_brief.community_name
        com['community_id'] = community._id.toHexString();
        com['role'] = "4"


        user.joined_community.push(com)
        await user.save()
        
        res.send(user)

    }catch(error){
        res.status(400).send(error.message)
    }
})


router.patch('/change_from_student', auth , async(req,res)=>{
    try{
        const community = await Community.findById(req.body.id)
        if(!community)
        {
            throw new Error("community not found")
        }
        const user = await User.findById(req.body.user_id)
        if(!user)
        {
            throw new Error("user not found")
        }
        let details = {}
        let obj = {}
        obj['user_name'] = community.community_brief.community_name
        obj['user_id'] = community._id.toHexString();
        obj['role'] = "4"
        let check = 0
        community.student_channel.forEach((element)=>{
            if(element.user_id === req.body.user_id)
            {
                details['user_name'] = element.user_name
                details['user_id'] = element.user_id
                details['role'] = "4"
                details['user_dp']=Buffer.from(element.user_dp)
                
                // obj['user_dp']=Buffer.from(element.user_dp)
                check = 1
            }
        })
        if(check===0)
        {
            throw new Error("No user found")
        }
        user.joined_community = user.joined_community.filter((user_id)=>{
            return user_id.user_id!=req.body.user_id;
        })
        delete details.role
        if(req.body.role === "teacher")
        {
            community.teacher.push(details);
            obj.role = "teacher"
            user.joined_community.push(obj)
        }
        if(req.body.role === "mentor")
        {
            community.mentor.push(details);
            obj.role = "mentor"
            user.joined_community.push(obj)
        }
        if(req.body.role === "professional")
        {
            community.professional.push(details);
            obj.role = "professional"
            user.joined_community.push(obj)
        }
        
        community.student_channel = community.student_channel.filter((user_id)=>{
            return user_id.user_id!=req.body.user_id;
        })
        await community.save()
        await user.save()
        res.status(200).send(community)

    }catch(error){
        res.status(400).send(error.message)
    }
})

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

router.post('/community/picture', upload.single('community_dp'), async (req, res) => {
    //console.log(req)
    try{
        const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
        const community = await Community.findById(req.body.id)
        if(!community)
        {
            throw new Error("community not found")
        }
    
        // const community_brief = await Community_brief.find({community_id : req.body.id})
        // if(!community_brief)
        // {
        //     throw new Error("community_brief not found")
        // }
        console.log(buffer)
        community.community_brief.community_dp=buffer
        //community_brief.community_dp = buffer
       // await community_brief.save()
        await community.save()
        res.send(req.body.id)
    } catch(e){
        res.status(400).send(e.message)
    }
    
   
}, (error, req, res, next) => {
    res.status(400).send(error.message )
})

module.exports = router
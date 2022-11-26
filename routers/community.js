const express = require('express');
const moment = require('moment');
const Community = require('../models/community');
const Community_brief = require('../models/community_brief');
const multer = require('multer');
const sharp = require('sharp');
const auth = require('../middleware/auth')
const User = require('../models/user')
const router = new express.Router()


router.post('/create_community',async(req, res) => {
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

    // console.log(obj);

    const community_brief= new Community_brief(obj)

    community_brief.save().then(()=>{
        console.log("saved");
    }).catch((error)=>{
        res.status(404)
        res.send(error)
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
            throw new Error()
        }
        res.send(community)
    }
    catch(e){
        res.status(404).send(e)
    }
})

router.patch('/add_community_request' , auth , async(req,res)=>{
    try{
        
        const community = await Community.findById(req.body.id)
        if(!community)
        {
            return res.status(401).send({error : 'No community found'})
        }
        const dp = Buffer.from(req.user.personal_detail.display_picture)
        //console.log(dp)

        let user_detail = {}

        user_detail['user_name']=req.user.personal_detail.name;
        user_detail['user_id']=req.user._id.toHexString();
        user_detail['user_dp']=dp;
        community.requests.push(user_detail)
        await community.save();
        res.send(community);
        
    }catch(e)
    {
        res.status(400).send(e)
    }
})

router.patch('/decline_request', async(req,res) =>{
    try{
        const community = await Community.findById(req.body.id)
        if(!community)
        {
            return res.status(401).send({error : 'No community found'})
        }
        community.requests = community.requests.filter((user_id)=>{
            return user_id.user_id!=req.body.user_id;
        })
        await community.save()
        res.send(community.requests)
        
    }catch(e)
    {
        res.status(400).send(e)
    }
})

router.patch('/accept_request' , async(req,res)=>{
    try{
        const community = await Community.findById(req.body.id)
        if(!community)
        {
            return res.status(401).send({error : 'No community found'})
        }
        const user = await User.findById(req.body.user_id)
        if(!user)
        {
            return res.status(401).send({error : 'No User found'})
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
            return res.status(401).send({error : 'No User found'})
        }
        community.requests = community.requests.filter((user_id)=>{
            return user_id.user_id!=req.body.user_id;
        })
        community.community_brief.user_count = community.members.length 
        community.members.push(details)
        user.joined_community.push(details)
        await user.save()
        await community.save()
        res.send(user)

    }catch(e)
    {
        res.status(400).send(e)
    }
})


// router.patch('change_from_student', auth , async(req,res)=>{
//     try{

//     }catch(e){

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

router.patch('/community/picture', upload.single('community_dp'), async (req, res) => {
    console.log(req)
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
    const community = await Community.findById(req.body.id)
    if(!community)
    {
        return res.status(401).send({error : 'No community found'})
    }
    try{
        community.community_brief.community_dp=buffer
        await community.save()
        res.send(req.body.id)
    } catch(e){
        res.status(400).send(e)
    }
    
   
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

module.exports = router
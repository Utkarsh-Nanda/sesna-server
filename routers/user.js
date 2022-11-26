const express = require('express')
const User = require('../models/user');
const User_brief = require('../models/user_brief');
const auth = require('../middleware/auth')
const router = new express.Router()
const multer = require('multer')
const sharp = require('sharp')

router.post('/user/signup',async(req,res)=>{
    const user= new User(req.body)
    try{
        await user.save()
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
        user_brief.save().then(()=>{
            console.log("saved");
        }).catch((error)=>{
            res.status(400).send(error)
        })

    }
    catch(e)
    {
        res.status(400)
        res.send(e)
    }
})

router.post('/user/login', async(req, res) => {
    try{
        const user=await User.findbycredentials(req.body.email,req.body.password)
        const token = await user.generate_authtoken()
        res.send({user , token})
    }catch(e){
        res.status(400).send({error:e.message})
    }
})


router.post('/user/logout', auth , async(req,res)=>{
    try{
        req.user.tokens = req.user.tokens.filter((token)=>{
            return token.token!=req.token
        })
        await req.user.save()
        res.send()
    }catch(e){
        res.send(500).send(e)
    }
})

router.post("/users/logoutall", auth , async(req,res)=>{
    try{
        req.user.tokens=[]
        await req.user.save()
        res.send()
    }catch(e){
        res.status(500).send()
    }
})


router.get('/users/me', auth , async(req,res)=>{
    res.send(req.user)
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
    }catch(e){
        res.status(400).send(e)
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
    }catch(e){
        res.status(400).send(e)
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
    res.status(400).send({ error: error.message })
})

router.delete('/users/me/cover_picture', auth, async (req, res) => {
    req.user.personal_detail.cover_picture = undefined
    await req.user.save()
    res.send()
})

router.post('/users/me/display_picture', auth, upload.single('display_picture'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
    req.user.personal_detail.display_picture = buffer
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

router.delete('/users/me/display_picture', auth, async (req, res) => {
    req.user.personal_detail.display_picture = undefined
    await req.user.save()
    res.send()
})

router.get('/users/:id/display_picture', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)

        if (!user || !user.personal_detail.display_picture) {
            throw new Error()
        }

        res.set('Content-Type', 'image/png')
        res.send(user.personal_detail.display_picture)
    } catch (e) {
        res.status(404).send()
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
    } catch (e) {
        res.status(404).send()
    }
})

module.exports = router
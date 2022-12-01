const express = require('express')
const CommunityBrief = require('../models/community_brief')
const router = new express.Router()

router.get('/get_all_community_brief', async(req, res) => {
    try {
        const community_brief = await CommunityBrief.find({})
        res.status.send(community_brief)
    }catch(error){
        res.status(400).send(error.message)
    }
})

router.get('/community_by_name' , async(req,res)=>{
    try{
        const brief = await CommunityBrief.find({})
        //const query = req.body.search
        //console.log(req.body.search)
        if(brief.length === 0)
        {
            throw new Error("No search found")
        }
        //const filtered_list = await brief.find({ community_name: { $regex: query } });
        let filtered_list = brief.filter((community_brief)=>{
           return community_brief.community_name.toLowerCase().includes(req.body.search)
        })
        res.status(200).send(filtered_list)
        
    }catch(e){
        res.status(500).send(e.message)
    }
})

router.get('/three_community' , async(req,res) =>{
    try{
        const com1 = await CommunityBrief.findById("6387c8ffd3f52f23627736f4")
        const com2 = await CommunityBrief.findById("6387c915d3f52f23627736f8")
        const com3 = await CommunityBrief.findById("6387c931d3f52f23627736fc")

        if(!com1 || !com2 || !com3)
        {
            throw new Error("Community brief not found")
        }
    res.status(200).send({com1 , com2 , com3})
    }catch(e){
        res.status(400).send(e.message)
    }

})



module.exports = router
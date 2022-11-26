const express = require('express')
const CommunityBrief = require('../models/community_brief')
const router = new express.Router()

router.get('/get_all_community_brief', async(req, res) => {
    try {
        const community_brief = await CommunityBrief.find({})
        res.send(community_brief)
    } catch (e) {
        res.status(500).send()
    }
})

module.exports = router
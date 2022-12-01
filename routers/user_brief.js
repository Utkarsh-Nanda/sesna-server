const express = require('express')
const User_brief = require('../models/user_brief')
const router = new express.Router()


router.get('/get_all_user_brief', async(req, res) => {
    try {
        const user_brief = await User_brief.find({})
        res.send(user_brief)
    } catch(error){
        res.status(400).send(error.message)
    }
})

module.exports = router
let mongoose = require('mongoose');

let commentSchema = mongoose.Schema({
    postedBy:{
        type: String,
        required: true
    },
    content:{
        type: String,
        required: true
    },
    tTitle:{
        type: String,
        required: true
    },
    ticketId:{
        type: String,
        required: true
    },
    timeStamp:{
        type: String,
        required: true
    }
});

let Comment = module.exports = mongoose.model('Comment', commentSchema);
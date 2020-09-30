let mongoose = require('mongoose');

let ticketSchema = mongoose.Schema({
    title:{
        type: String,
        required: true
    },
    timeStamp:{
        type: String,
        required: true
    },
    description:{
        type: String,
        required: true
    },
    foundBy:{
        type: String,
        required: true
    },
    assignedTo:{
        type: String,
        required: true
    },
    priority:{
        type: String,
        required: true
    },
    status:{
        type: String,
        required: true
    },
    type:{
        type: String,
        required: true
    }
});

let Ticket = module.exports = mongoose.model('Ticket', ticketSchema);
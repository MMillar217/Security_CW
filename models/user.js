let mongoose = require('mongoose');

let userSchema = mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    username:{
        type: String,
        required: true
    },
    password:{
        type: String,
        required: true
    },
    role:{
        type: String,
        required: true
    },
    approved:{
        type: String,
        required: true
    },
    teamId:{
        type: String,
        required: false
    }
});

let User = module.exports = mongoose.model('User', userSchema);
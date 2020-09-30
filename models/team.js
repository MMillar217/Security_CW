let mongoose = require('mongoose');

let teamSchema = mongoose.Schema({
    teamName:{
        type: String,
        required: true
    }
});

let Team = module.exports = mongoose.model('Team', teamSchema);
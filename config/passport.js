const LocalStrategy = require('passport-local').Strategy;
const config = require('./database');
const User = require('../models/user');
const bcrypt = require('bcryptjs');

module.exports = function(passport){
    passport.use(new LocalStrategy(function(username, password, done){
        let query = {username:username};
        User.findOne(query, function(error, user){
            if(error){
                console.log(error);
            }
            if(!user){
                return done(null, false, {message: 'incorrect username/password'});
            }

            //passwprd
            bcrypt.compare(password, user.password, function(error, match){
                if(error){
                    console.log(error);
                }
                if(match){
                    return done(null, user);
                }
                else{
                    return done(null, false, {message: 'incorrect username/password'});
                }
            });
        });
    }));

    //passport documentation
    passport.serializeUser(function(user, done) {
        done(null, user.id);
      });
      
    passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
    });
}
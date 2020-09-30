const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const config = require('./config/database');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const flash = require('connect-flash');
const request = require('request');

//connecting to the database
mongoose.connect(config.database);
let db = mongoose.connection;
//checking connection
db.once('open', function(){
    console.log('connected to the database');
});
db.on('error', function(err){
    console.log(err);
});
const app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

//setting public folder
app.use(express.static(path.join(__dirname, 'public')));

//bring in models
let Ticket = require('./models/ticket');
let User = require('./models/user');
let Comment = require('./models/comment');
let Team = require('./models/team');

//view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

//express session (expressjs/express-session)
app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true
    //cookie: { secure: true }
  }));

//express messages (vissionmedia/express-messages)
app.use(require('connect-flash')());
app.use(function (req, res, next) {
    res.locals.messages = require('express-messages')(req, res);
    next();
});

//passport config
require('./config/passport')(passport);
app.use(passport.initialize());
app.use(passport.session());

app.get('*', function(req, res, next){
    res.locals.user = req.user || null;
    next();
});

// ROUTES --------------------------------------------------

//recaptcha



//index page route - finds all the tickets stored in the database
app.get('/', checkAuthentication, function(req, res){
    let loggedUser = req.user._id;
    Ticket.find({}, function(err, tickets){
        User.findById(loggedUser, function(err, user){
            Team.find({}, function(err, uteams){
                User.find({}, function(err, ousers){
                    if(err){
                        console.log(err);
                    }
                    else {
                        res.render('index', {
                            title:'View Tickets',
                            tickets: tickets,
                            user: user,
                            uteams: uteams, 
                            ousers:ousers
                        });
                    }
                })
            })
        })
    });
});

//tickets
// create ticket route - loads form to create ticket
app.get('/tickets/create', checkAuthentication, checkApproval, function(req, res){
    User.find({}, function(err, ctusers){
        if(err){
            console.log(err);
        }
        else{
            res.render('create-ticket', {
                title:'Create Ticket',
                ctusers:ctusers
            });
        }
    })
    
});
//posting ticket route - adds the ticket details entered by user to the database
app.post('/tickets/create', function(req, res){
    // generate a timestamp
    var timestamp = Number(new Date())
    var createdDate = new Date(timestamp)

    let ticket = new Ticket();
    ticket.timeStamp = createdDate
    ticket.title = req.body.title;
    ticket.description = req.body.description;
    ticket.foundBy = req.user._id;
    ticket.assignedTo = req.body.assignedTo;
    ticket.priority = req.body.priority;
    ticket.status = 'Open';
    ticket.type = req.body.type;

    //validate form
    formValidationTic(ticket.title, ticket.description, req, res);

    ticket.save(function(err){
        if(err){
            //console.log(err);
            return;
        }
        else {
            req.flash('success', 'ticket created');
            res.redirect('/');
        }
    })
});

//ticket route - loads the details for selected ticket
app.get('/ticket/:id', checkAuthentication, checkApproval, function(req, res){
    Ticket.findById(req.params.id, function(err, ticket){
        User.findById(ticket.foundBy, function(error, user){
            Comment.find({}, function(err, comments){
                User.find({}, function(err, cusers){
                    User.findById(ticket.assignedTo, function(err, auser){
                        if(err){
                            console.log(err);
                        }
                        else{
                            res.render('ticket', {
                                ticket:ticket,
                                foundBy: user.name,
                                assignedTo:auser.name,
                                unameFoundBy: user.username,
                                unameAssignedTo:auser.username,
                                comments:comments,
                                cusers:cusers
                            });
                        }
                    })
                    
                })
                
            })
            
        })
    });
});
//add comment to ticket
app.post('/ticket/:id', function(req, res){
    //generate time stamp
    var timestamp = Number(new Date())
    var postingDate = new Date(timestamp)

    let comment = new Comment();
    comment.postedBy = req.user._id;
    comment.content = req.body.comment;
    comment.tTitle = req.body.tTitle;
    comment.ticketId = req.body.ticketId;
    comment.timeStamp = postingDate;

    let contentVal = req.body.comment;
    if(contentVal == ""){
        req.flash('danger', 'Please write a comment first');
        res.redirect('/');
    }

    comment.save(function(err){
        if(err){
            console.log(err);
            return;
        }
        else{
            req.flash('success', 'comment added');
            res.redirect('/');
        }
    })
})

//edit ticket route - edit ticket form
app.get('/ticket/edit/:id', checkAuthentication, checkApproval, function(req, res){
    Ticket.findById(req.params.id, function(err, ticket){
        if(ticket.foundBy = req.user._id || req.user.role == "Admin"){
            
            res.render('edit_ticket', {
                title:'Edit Ticket',
                ticket:ticket
            });
        }
        else{
        req.flash('danger', 'not authorised');
        res.redirect('/');
        }
    });
});
//post update ticket route
app.post('/tickets/edit/:id', checkAuthentication, checkApproval, function(req, res){
    let ticket = {};
    //ticket.title = req.body.title
    //ticket.description = req.body.description
    //ticket.foundBy = req.user._id
    //ticket.assignedTo = req.body.assignedTo
    ticket.priority = req.body.priority
    ticket.status = req.body.status
    //ticket.type = req.body.type

    let editQuery = {_id:req.params.id}
    
    Ticket.updateOne(editQuery, ticket, function(err){
        if(err){
            console.log(err);
            return;
        }
        else {
            req.flash('success', 'ticket updated');
            res.redirect('/');
        }
    })
});
//deleting ticket route - tickets are deleted in main.js with ajax
app.delete('/ticket/:id', function(req, res){
    let deleteQuery = {_id:req.params.id}
    Ticket.deleteOne(deleteQuery, function(err){
        if(err){
            console.log(err);
        }
        res.send('deleted');
    });
});


//deleting comment route - in main.js with ajax
app.delete('/comment/:id', function(req, res){
    let deleteQuery = {_id:req.params.id}
    Comment.deleteOne(deleteQuery, function(err){
        if(err){
            console.log(err);
        }
        res.send('deleted');
    });
});

//users
//register page
app.get('/users/register', function(req, res){
    res.render('register', {
        title:'Register'
    })
});
//post new user
app.post('/users/register', function(req, res){
    //get details from the form
    const name = req.body.name;
    const username = req.body.username;
    const password = req.body.password;
    const role = req.body.role;
    let approved = false;
    
    formValidationReg(name, username, password, req, res);

    //checking availability of username
    User.findOne({username: username}, function(err, user, next){
        if(err){
            console.log(err);
        }
        if(user){
            req.flash('danger', 'username already in use');
            res.redirect('/users/register');
            return;
        }

        let nuser = new User({
            name: name,
            username: username,
            password: password,
            role: role,
            approved: approved
        });
    
        //encrypting the password before saving user to the database
        bcrypt.genSalt(10, function(error, salt){
            bcrypt.hash(nuser.password, salt, function(error, hash){
                if(error){
                    console.log('ERROR: ', error)
                }
                nuser.password = hash;
    
                nuser.save(function(error){
                    if(error){
                        console.log(error);
                        return;
                    }
                    else {
                        req.flash('success', 'user registered');
                        res.redirect('/users/login');
                    }
                });
            });
        });
    })
});
//user login page
app.get('/users/login', function(req, res){
    res.render('login', {
        title:'Login'
    })
});
    
app.post('/users/login', function(req, res, next){
    
    const username = req.body.username;
    const password = req.body.password;
    const capatcha = req.body['g-recaptcha-response'];
    if(capatcha == false){
        req.flash('danger', 'Please complete reCaptcha');
        res.redirect('/users/login');
    }
    else{
        passport.authenticate('local', {
            successRedirect:'/',
            failureRedirect:'/users/login',
            failureFlash: true
        })(req, res, next)
    }
})


//user logout
app.get('/users/logout', function(req, res){
    req.logOut();
    req.flash('success', 'logged out');
    res.redirect('/users/login');
});

//admin
//admin main page route
app.get('/admin-control', checkAuthentication, checkAdmin, function(req, res){
    User.find({}, function(err, vusers){
        Team.find({}, function(err, ateams){
            if(err){
                console.log(err);
            }
            else {
                res.render('admin-control', {
                    title:'Admin Page',
                    vusers: vusers,
                    ateams: ateams
                });
            }
        })
    });
});
//post for create team
app.post('/admin-control', function(req, res){
    let team = new Team();
    team.teamName = req.body.teamName;
    let teamName = req.body.teamName;

    if(teamName == ""){
        req.flash('danger', 'Please enter a team name');
        res.redirect('/admin-control');
    }
    
    team.save(function(err){
        if(err){
            console.log(err);
        }
        else{
            req.flash('success', 'team created');
            res.redirect('/admin-control');
        }
    })
    
})
//view user route
app.get('/admin-control/user/:id', checkAuthentication, checkAdmin, function(req, res){
    User.findById(req.params.id, function(err, user){
        Team.find({}, function(err, auteams){
            if(req.user.role != "Admin"){
                req.flash('danger', 'not authorised');
                res.redirect('/');
            }
            res.render('admin-user', {
                title:'User Rights', 
                user:user,
                auteams:auteams
            });
        })
    });
});
//update user route
app.post('/admin-control/user/:id', function(req, res){
    let user = {};
    user.approved = req.body.approved
    user.teamId = req.body.team
    let editQuery = {_id:req.params.id}

    User.updateOne(editQuery, user, function(err){
        if(err){
            console.log(err);
            return;
        }
        else{
            req.flash('success', 'User updated');
            res.redirect('/admin-control');
        }
    })
})

//access control
//checks that the user is logged in - uses passportjs
function checkAuthentication(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    else{
        req.flash('danger', 'must log in');
        res.redirect('/users/login');
    }
}
//checks if the user is an admin
function checkAdmin(req, res, next){
    if(req.user.role == "Admin"){
        return next();
    }
    else{
        req.flash('danger', 'Admin Only');
        res.redirect('/');
    }
}
//checks if admin has approved the user
function checkApproval(req, res, next){
    if(req.user.approved == "true"){
        return next();
    }
    else{
        req.flash('danger', 'Admin has not granted approval yet or privileges have been revoked');
        res.redirect('/');
    }
}
function checkNotAthenticated(req, res, next){
    if(!req.isAuthenticated()){
        return next();
    }
    else
    {
        req.flash('danger', 'already logged in');
        res.redirect('/');
    }
}

//starts the server
app.listen(8080, function(){
    console.log('Server started localhost:8080');
});

//validation functions
//validates the creation of tickets
function formValidationTic(title, description, req, res){
    if(title == "" || description == ""){
            req.flash('danger', 'please complete all fields');
            res.redirect('/tickets/create');
        }
    return;
}

//validates registration
function formValidationReg(name, username, password, req, res){
    if(name == "" || username == "" ||
     password == ""){
         req.flash('danger', 'please complete all fields');
         res.redirect('/users/register');
     }
     return;
}
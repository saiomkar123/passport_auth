// include packages
var express = require('express');
var app = express();
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var passport = require('passport');
var User = require('./app/models/user');
var config = require('./config/main');
var jwt = require('jsonwebtoken');
var port = 9874;


// the body-parser to get POST requests for API use
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());


// Log requests to console
app.use(morgan('dev'));

// Initialize passport for use
app.use(passport.initialize());

// Connect to db
mongoose.connect(config.database);

// Bring in passport strategy we just defined
require('./config/passport')(passport);

// reate API group routes
var apiRoutes = express.Router();

// Register new users
apiRoutes.post('/register', function(req, res){
    if(!req.body.email || !req.body.password){
        res.json({success: false, message: 'Please enter an email and password to register.'});
    }else{
        var newUser = new User({
            email: req.body.email,
            password: req.body.password
        });

        // Attempt to save the new user
        newUser.save(function(err){
            if(err){
                return res.json({success: false, message: 'Email address alredy exists'});
            }
            res.json({success: true, message: 'Successfully created new user'});
        })
    }
})

// Authenticate the user and get a jwt
apiRoutes.post('/authenticate', function(req, res){
    User.findOne({
        email: req.body.email
    }, function(err, user){
        if(err) throw err;
        if(!user){
            res.send({success: false, message: 'Authentication Failed. User not found'});
        }else{
            // Check if the password mathces
            user.comparePassword(req.body.password, function(err, isMatch){
                if(isMatch && !err){
                    // Create the token
                    var token = jwt.sign(user, config.secret, {
                        expiresIn: 10000 // in seconds
                    });
                    res.json({success: true, message: 'JWT '+token});
                }else{
                    res.send({succes: false, message: 'Authentication failed. Password do not match'});
                }
            })
        }
    })
})

// Protect dashboard route with jwt
apiRoutes.get('/dashboard', passport.authenticate('jwt', {session: false}), function(req, res){
    res.send('It workded! User id is: '+req.user._id + '.')
})

// Set url for Api Group routes

app.use('/api', apiRoutes);

// HOme route
app.get('/', function(req, res){
    res.send('Relax, We will put the home screen');
})


app.listen(port, function(){
    console.log('Server is running in port NO: '+port);
})
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const randomString = require('randomstring');
const {
    check,
    validationResult
} = require('express-validator');
var db = require('../bin/database');
var emailService = require('../bin/email');

/*
 * Routes for the Login page
 */

router.get('/login', (req, res) => {
    console.log('[GET] Request for LOGIN recieved');
    if (req.session.User) {
        res.redirect('/');
        return;
    }
    res.render('includes/modals/modal-login');
});

router.post('/login', (req, res) => {
    console.log('[POST] Request for LOGIN recieved');
    var email = req.body.email;
    var password = req.body.password;

    if (email.length == 0 || password.length == 0) {
        res.status(500).send('Email and Password fields are required!');
    } else {
        db.get().collection('users').findOne({
            "email": email.toLowerCase()
        }, (e, result) => {
            if (e) throw e;
            if (!result) {
                //Alert for wrong username or password.
                res.status(500).send('Wrong username or password!');
                return;
            }
            if (!bcrypt.compareSync(password, result.password)) {
                //Alert for wrong username or password.
                res.status(500).send('Wrong username or password!');
                return;
            }

            req.session.User = result;
            res.status(200).send('Logged in successfully!');
        });
    }
});

/*
 * Routes for the Register page
 */

router.get('/register', (req, res) => {
    console.log('[GET] Request for REGISTER recieved');
    if (req.session.User) {
        res.redirect('/');
        return;
    }
    res.render('includes/modals/modal-register');
});

router.post('/register', [
    check('email').normalizeEmail().isEmail().withMessage('Email must be a valid email address')
    .custom((val) => {
        return db.get().collection('users').findOne({
            "email": val.toLowerCase()
        }, {
            "email": 1
        }).then(user => {
            return user ? Promise.reject('Email address is already taken') : true;
        });
    }),
    check('password', 'Password field is required').isLength({
        min: 6
    }).withMessage('Password Must be at least 6 characters long!')
    .matches(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W)/).withMessage('Password must contain at least 1 capital letter, 1 lower case letter, 1 number and 1 symbol'),
    check('password2', 'Passwords do not match').custom((value, {
        req
    }) => {
        return value !== req.body.password ? Promise.reject('Password confirmation is incorrect') : true;
    })
], (req, res) => {
    console.log('[POST] Request for REGISTER recieved');
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(500).send(errors.errors.map(error => error.msg));
    } else {
        let email = req.body.email;
        let password = req.body.password;

        db.get().collection('users').save({
            email: email.toLowerCase(),
            password: bcrypt.hashSync(password, 10),
            permaLink: email.toLowerCase().replace(' ', '').replace(/[^\w\s]/gi, '').trim(),
            verificationToken: randomString.generate({
                length: 64
            }),
            isActive: false,
            passwordResetToken: '',
            passwordResetTokenExpires: Date.now(),
            searchHistory: [],
        }, (e, result) => {
            if (e) throw e;
        });
           
        db.get().collection('users').findOne({
            "email": email
        }, {
            "email": 1,
            "permaLink": 1,
            "verificationToken": 1
        }, (e, result) => {
            if (e) throw e;

            let body = "Follow this link to activate your account: " + req.protocol + '://' + req.get('host') + '/account/confirm/' + result.permaLink + '/' + result.verificationToken;  // TODO: Needs Improvement!
            console.log(body);

            emailService.sendMail({
                receiverEmail: result.email,
                title: "Weathery - Email Confirmation",
                body: body,
            }, (e, result) => {
              e ? console.log(e) : console.log(result); // TODO: Remove error
            });
        });

        res.status(200).send('Registered successfully!');
    }
});

/*
 * Routes for the Profile page
 */

router.get('/profile', (req, res) => {
    console.log('[GET] Request for PROFILE recieved');
    if (!req.session.User) {
        res.redirect('login');
        return;
    }
    res.render('includes/modals/modal-profile', {
        pageUrl: 'profile',
        User: req.session.User
    }); // Passing pageUrl to use in navbar.
});

/*
 * Route for Loging Out 
 */

router.post('/logout', (req, res) => {
    console.log('[POST] Request for LOGOUT recieved');
    req.session.User = null;
    res.redirect('/');
    return;
});

/*
 * Route for Confirming Email
 */

router.get('/confirm/:permaLink/:verificationToken', (req, res) => {
    console.log('[GET] Request for CONFIRM EMAIL recieved');

    var permaLink = req.params.permaLink;
    var verificationToken = req.params.verificationToken;

    db.get().collection('users').findOne({
        'permaLink': permaLink
    }, function (e, result) {
        if (e) throw e;
        if (result) {
            if (result.verificationToken == verificationToken) {
                db.get().collection('users').updateOne({
                    'permaLink': permaLink
                }, {
                    $set: {
                        'isActive': true
                    }
                }, (e, result) => {
                    if (e) throw e;
                });
            } else {
                console.log('The token is wrong!');
            }
        } else {
            console.log('Invalid User');
        }
        res.redirect('/');
    });
});

/*
 * Route for Password Resetting
 */

router.get('/forgot-password', (req, res) => {
    console.log('[GET] Request for FORGOT PASSWORD recieved');
    if (req.session.User) {
        res.redirect('/');
        return;
    }
    res.render('includes/modals/modal-forgot-password');
});

router.post('/forgot-password', [
    check('email').normalizeEmail().isEmail().withMessage('Email must be a valid email address')
    .custom((val) => {
        return db.get().collection('users').findOne({
            "email": val.toLowerCase()
        }, {
            "email": 1
        }).then(user => {
            return user ? true : Promise.reject('No user with that Email address');
        });
    })
], (req, res) => {
    console.log('[POST] Request for FORGOT PASSWORD recieved');
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(500).send(errors.errors.map(error => error.msg));
    } else {
        db.get().collection('users').updateOne({
            'email': req.body.email
        }, {
            $set: {
                'passwordResetToken': randomString.generate({
                    length: 15
                }),
                'passwordResetTokenExpires': Date.now() + 3600000 // 1 Hour
            }
        }, (e, result) => {
            if (e) throw e;
        });

        db.get().collection('users').findOne({
            "email": req.body.email
        }, {
            "email": 1,
            "permaLink": 1,
            "passwordResetToken": 1
        }, (e, result) => {
            if (e) throw e;
          
            let body = "Follow this link to reset your password: " + req.protocol + '://' + req.get('host') + '/account/change-password/' + result.permaLink + '/' + result.passwordResetToken;  // TODO: Needs Improvement!
            console.log(body);
          
            emailService.sendMail({
                receiverEmail: result.email,
                title: "Weathery - Password Reset",
                body: body,
            }, (e, result) => {
              e ? console.log(e) : console.log(result); // TODO: Remove error
            });
        });

        res.status(200).send('Sent reset password email!');
    }
});

router.get('/change-password/:permaLink/:passwordResetToken', [
    check('permaLink').not().isEmpty(),
    check('passwordResetToken').isLength({
        'max': 15,
        'min': 15
    })
], (req, res) => {
    console.log('[GET] Request for RESET PASSWORD recieved');
    if (req.session.User) {
        res.redirect('/');
        return;
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.redirect('/account/forgot-password');
    } else {
        res.render('reset-password');
    }
});

router.post('/change-password/:permaLink/:passwordResetToken', [
    check('permaLink').not().isEmpty(),
    check('passwordResetToken').isLength({
        'max': 15,
        'min': 15
    }),
    check('password', 'Password field is required').isLength({
        min: 6
    }).withMessage('Password Must be at least 6 characters long!')
    .matches(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W)/).withMessage('Password must contain at least 1 capital letter, 1 lower case letter, 1 number and 1 symbol'),
    check('password2', 'Passwords do not match').custom((value, {
        req
    }) => {
        return value !== req.body.password ? Promise.reject('Password confirmation is incorrect') : true;
    })
], (req, res) => {
    console.log('[POST] Request for RESET PASSWORD recieved');
    if (req.session.User) {
        res.redirect('/');
        return;
    }
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.render('reset-password', {
            errors: errors.errors.map(error => error.msg)
        });
    } else {
        const permaLink = req.params.permaLink;
        const passwordResetToken = req.params.passwordResetToken;
        const newPassword = req.body.password;

        db.get().collection('users').findOne({
            'permaLink': permaLink
        }, function (e, result) {
            if (e) throw e;
            if (result) {
                if (result.passwordResetToken == passwordResetToken && result.passwordResetTokenExpires >= Date.now()) {
                    db.get().collection('users').updateOne({
                        'permaLink': permaLink
                    }, {
                        $set: {
                            'password': bcrypt.hashSync(newPassword, 10),
                            'passwordResetToken': '',
                            'passwordResetTokenExpires': Date.now()
                        }
                    }, (e, result) => {
                        if (e) throw e;
                    });

                    res.redirect('/');
                } else {
                    res.render('reset-password', {
                        errors: ['Invalid User or Expired Token!']
                    });
                }
            } else {
                res.render('reset-password', {
                    errors: ['Invalid User or Expired Token!']
                });
            }
        });
    }
});

/*
 * Route for Profile
 */

router.post('/update-profile', [
    check('email').normalizeEmail().isEmail().withMessage('Email must be a valid email address')
    .custom((value, {
        req
    }) => {
        return db.get().collection('users').findOne({
            "email": value.toLowerCase()
        }, {
            "email": 1
        }).then(user => {
            if (req.session.User.email != value) {
                return user ? Promise.reject('Email address is already taken') : true;
            }
            return true;
        });
    }),
    check('currentPassword')
    .custom((value, {
        req
    }) => {
        return db.get().collection('users').findOne({
            "email": req.session.User.email
        }, {
            "email": 1,
            "password": 1
        }).then(user => {
            if (user) {
                return bcrypt.compareSync(value, user.password) ? true : Promise.reject('Wrong Current Password!');
            } else {
                return Promise.reject('Invalid User!')
            }
        });
    }),
    check('newPassword', 'Password field is required')
    .custom((value, {
        req
    }) => {
        if (req.body.checked == "true") {
            if (value.length >= 6) {
                return value.match(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W)/) ?
                    true :
                    Promise.reject('Password must contain at least 1 capital letter, 1 lower case letter, 1 number and 1 symbol');
            } else {
                return Promise.reject('Password Must be at least 6 characters long!');
            }
        }
        return true;
    }),
    check('newPassword2', 'Passwords do not match')
    .custom((value, {
        req
    }) => {
        return value !== req.body.newPassword ? Promise.reject('Password confirmation is incorrect') : true;
    })
], (req, res) => {
    console.log('[POST] Request for UPDATE PROFILE recieved');
    if (!req.session.User) {
        res.redirect('/');
        return;
    }
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(500).send(errors.errors.map(error => error.msg));
    } else {
        let email = req.body.email;
        let newPassword = req.body.newPassword;
        let changePassword = req.body.checked;

        let changes = {};

        if (email != req.session.User.email) {
            changes.email = email;
            changes.isActive = false;
            changes.permaLink = email.toLowerCase().replace(' ', '').replace(/[^\w\s]/gi, '').trim();
            changes.verificationToken = randomString.generate({
                length: 64
            });
        }

        if (changePassword == "true") {
            changes.password = bcrypt.hashSync(newPassword, 10);
        }

        db.get().collection('users').updateOne({
            'email': req.session.User.email
        }, {
            $set: changes
        }, (e, result) => {
            if (e) throw e;
        });

        req.session.User = null;
        res.status(200).send('Successfully Updated Profile!');
    }
});

module.exports = router;
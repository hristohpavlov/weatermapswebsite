const express = require('express');
const router = express.Router();

// Example route
// router.get('/<PAGE_NAME>', (req, res) => {
//   console.log('Request for <PAGE_NAME> recieved');
//   res.render('includes/test', { pageUrl: '<PAGE_NAME>', isUserAuthenticated: false }); // Passing pageUrl to use in navbar.
// })

/*
 * Route for the Home page
 */

router.get('/', (req, res) => {
    console.log('[GET] Request for INDEX recieved');
    res.render('index', {
        pageUrl: 'index',
        User: req.session.User
    }); // Passing pageUrl to use in navbar.
});

module.exports = router;
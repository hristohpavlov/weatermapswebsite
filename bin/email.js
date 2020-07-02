const nodemailer = require('nodemailer');
var email = null;
var emailAddress = null;

exports.setUp = (gmailUser) => {
    if (email) return;
  
    email = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: gmailUser.email,
        pass: gmailUser.pass
      }
    });
    
    emailAddress = gmailUser.email;
};

exports.sendMail = (emailInfo, callback) => {
  email.sendMail({
    from: emailAddress,
    to: emailInfo.receiverEmail,
    subject: emailInfo.title,
    text: emailInfo.body
  }, (error, info) => callback(error, info)); 
};

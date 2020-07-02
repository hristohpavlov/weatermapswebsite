const MongoClient = require('mongodb').MongoClient;
var db = null;

exports.connect = (url, next) => {
    if (db) return next();

    MongoClient.connect(url, function (e, database) {
        if (e) return next(e);
        db = database;
        next();
    });
}

exports.close = (next) => {
    if (db) {
        db.close(function (e, result) {
            db = null;
            next(e);
        });
    }
}

exports.get = () => db;
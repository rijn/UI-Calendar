var express = require('express');
var app = express();
const Q = require('q');
const util = require('./util');
var fetch = require('./fetch');
var md5 = require('md5');

var config = util.getConfig();

var mysql = require('mysql');
var connection = mysql.createPool(config.mysql);

var connectPool = function(sharedObject) {
    var deferred = Q.defer();
    connection.getConnection(function(err, connection) {
        if (err) deferred.reject(err);
        deferred.resolve(sharedObject);
    });
    return deferred.promise;
}

var getConst = function(sharedObject) {
    var deferred = Q.defer();

    connection.query('SELECT `name`, `value` FROM `const`', function(err, rows, fields) {
        if (err) deferred.reject(err);

        sharedObject.ENV = {};
        for (var i = 0; i < rows.length; i++) {
            sharedObject.ENV[rows[i].name] = rows[i].value;
        }

        deferred.resolve(sharedObject);
    });

    return deferred.promise;
}

app.use(express.static('public'));

app.get('/', function(req, res) {
    res.send('/index.html');
});

app.get('/save', function(req, res) {
    // res.send(req.query);
    fetch(req.query.netid, req.query.password, res)
        .then(function(sharedObject) {
            if (sharedObject.course[0] == null) {
                throw new Error;
            }
            return sharedObject;
        })
        .then(connectPool)
        .then(getConst)
        .then(function(sharedObject) {
            // console.log(sharedObject.ENV);
            var deferred = Q.defer();

            connection.query('SELECT COUNT(*) as count FROM `data` WHERE `netid` = ? and `md5` = ?', [req.query.netid, md5(req.query.netid + sharedObject.ENV.term)], function(err, rows, fields) {
                if (err) deferred.reject(err);

                sharedObject.count = rows[0].count;
                console.log(sharedObject.count);

                deferred.resolve(sharedObject);
                // console.log('The solution is: ', rows[0].solution);
                // res.send('OPERATE SUCCESSFULLY');
            });
            return deferred.promise;
        })
        .then(function(sharedObject) {
            var deferred = Q.defer();
            if (sharedObject.count > 0) {
                connection.query('UPDATE `data` SET `data` = ?  WHERE `netid` = ? and `md5` = ?', [JSON.stringify(sharedObject.course), req.query.netid, md5(req.query.netid + sharedObject.ENV.term)],
                    function(err, rows, fields) {
                        if (err) deferred.reject(err);
                        deferred.resolve(sharedObject);
                    });
            } else {
                connection.query('INSERT INTO `data` SET ?', {
                        'data': JSON.stringify(sharedObject.course),
                        'netid': req.query.netid,
                        'md5': md5(req.query.netid + sharedObject.ENV.term)
                    },
                    function(err, rows, fields) {
                        if (err) deferred.reject(err);
                        deferred.resolve(sharedObject);
                    });
            }
            return deferred.promise;
        })
        .then(function(sharedObject) {
            // connection.end();
            res.send(md5(req.query.netid + sharedObject.ENV.term));
        })
        .fail(function(error) {
            // console.log(error);
            // connection.end();
            res.send('ERROR');
        });
});

var generate = require('./generate.js');

app.get('/get/:md5', function(req, res) {
    // res.send(req.params.md5);
    connectPool({})
    .then(getConst)
        .then(function(sharedObject) {
            // console.log(sharedObject.ENV);
            var deferred = Q.defer();

            connection.query('SELECT `data` FROM `data` WHERE `md5` = ?', [req.params.md5], function(err, rows, fields) {
                if (err) deferred.reject(err);

                sharedObject.data = rows[0].data;
                sharedObject.course = JSON.parse(sharedObject.data);
                // console.log(sharedObject.data);

                deferred.resolve(sharedObject);
            });
            return deferred.promise;
        })
        .then(generate)
        .then(function(sharedObject) {
            // connection.end();
            res.send(sharedObject.ics);
        })
        .fail(function(error) {
            // connection.end();
            res.send('ERROR');
        });
});

app.listen(3006, function() {
    console.log('Example app listening on port 3000!');
});

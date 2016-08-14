// get arguments

var arguments = process.argv.splice(2);
console.log(arguments);

const Q = require('q');

const https = require('https');
const querystring = require('querystring');

const util = require('./util');

const colors = require('colors');
util.colorSetTheme(colors);

var config = util.getConfig();

var getCourses = function(netID, password) {
    var getPrepare = function() {
        var deferred = Q.defer();
        deferred.resolve({
            'cookie': []
        });
        return deferred.promise;
    }
    var funcs = [
        function(sharedObject) {
            var deferred = Q.defer();

            var options = {
                hostname: 'my.illinois.edu',
                port: 443,
                path: '/uPortal/render.userLayoutRootNode.uP',
                method: 'GET',
                headers: {
                    'Host': 'my.illinois.edu',
                    'Upgrade-Insecure-Requests': 1,
                    'Cookie': sharedObject.cookie.join(';'),
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1547.62 Safari/537.36'
                }
            };

            console.log('\nREQUEST'.request, options.hostname + options.path);

            var req = https.request(options, (res) => {
                console.log('STATUS'.result, res.statusCode);
                if (config.debug) {
                    console.log('HEADERS'.data, res.headers);
                }

                res.on('data', (d) => {
                    // process.stdout.write(d);
                });

                res.on('end', () => {
                    util.combineCookies(res.headers['set-cookie'], sharedObject);
                    // console.log('cookie : ', sharedObject.cookie);
                    deferred.resolve(sharedObject);
                });
            });
            req.end();

            req.on('error', (e) => {
                console.error(e);
            });

            return deferred.promise;
        },

        function(sharedObject) {
            var deferred = Q.defer();

            var postData = querystring.stringify({
                'action': 'login',
                'userName': netID,
                'password': password,
                'Login': 'Sign+In',
            });

            var options = {
                jar: true,
                hostname: 'my.illinois.edu',
                port: 443,
                path: '/uPortal/Login',
                method: 'POST',
                headers: {
                    'Host': 'my.illinois.edu',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': postData.length,
                    'Cookie': sharedObject.cookie.join(';'),
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1547.62 Safari/537.36'
                }
            };

            console.log('\nREQUEST'.request, options.hostname + options.path);

            var req = https.request(options, (res) => {
                console.log('STATUS'.result, res.statusCode);
                if (config.debug) {
                    console.log('HEADERS'.data, res.headers);
                }

                res.setEncoding('utf8');
                res.on('data', (chunk) => {
                    // console.log(`BODY: ${chunk}`);
                });
                res.on('end', () => {
                    util.combineCookies(res.headers['set-cookie'], sharedObject);
                    // console.log('No more data in response.')
                    deferred.resolve(sharedObject);
                })
            });

            req.on('error', (e) => {
                console.log(`problem with request: ${e.message}`);
            });

            // write data to request body
            req.write(postData);
            req.end();

            return deferred.promise;
        },

        function(sharedObject) {
            var deferred = Q.defer();

            var options = {
                hostname: 'my.illinois.edu',
                port: 443,
                path: '/uPortal/render.userLayoutRootNode.uP?uP_root=root&uP_sparam=activeTabTag&activeTabTag=Academics',
                method: 'GET',
                headers: {
                    'Host': 'my.illinois.edu',
                    'Cookie': sharedObject.cookie.join(';'),
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1547.62 Safari/537.36'
                }
            };

            console.log('\nREQUEST'.request, options.hostname + options.path);

            var data = '';

            var req = https.request(options, (res) => {
                console.log('STATUS'.result, res.statusCode);
                if (config.debug) {
                    console.log('HEADERS'.data, res.headers);
                }

                var contentLength = res.headers['content-length'];

                res.on('data', (d) => {
                    data += d;
                    process.stdout.write("Downloading " + data.length + " bytes ");
                    for (var i = 0; i < 20; i++) {
                        if (i / 20 < data.length / contentLength) {
                            process.stdout.write("▓");
                        } else {
                            process.stdout.write("▓".gray);
                        }
                    }
                    process.stdout.write("\r");
                    process.stdout.write("\r");
                    // process.stdout.write(d);
                });

                res.on('end', () => {
                    util.combineCookies(res.headers['set-cookie'], sharedObject);
                    // console.log('DATA'.data, data.data);
                    sharedObject.courseRawData = data;

                    deferred.resolve(sharedObject);
                });
            });

            // req.write(postData);
            req.end();

            req.on('error', (e) => {
                console.error(e);
            });

            return deferred.promise;
        }
    ];

    var result = Q.fcall(getPrepare);
    funcs.forEach(function(f) {
        result = result.then(f);
    });

    // .done();

    return result;
}

const htmlparser = require("htmlparser2");

var parseData = function(sharedObject) {
    var deferred = Q.defer();

    var level = 0,
        flag = false,
        tableLevel = 0,
        course = [],
        subArray = [],
        thirdArray = [];

    var parser = new htmlparser.Parser({
        onopentag: function(name, attribs) {
            level++;
            if (name.request.indexOf('table') >= 0 && level == 19) {
                tableLevel = level;
                flag = true;
            }
            if (flag === true) {
                // console.log(level, name.request, attribs);
            }
        },
        ontext: function(text) {
            text = text.replace("\n", "");
            if (flag === true) {
                // console.log("-->", text);
                switch (level) {
                    case 20:
                        if (subArray[0] != null && thirdArray[0] != null) {
                            subArray.push(thirdArray);
                            course.push(subArray);
                        }
                        subArray = [];
                        thirdArray = [];
                        break;
                    case 21:
                        if (text !== ' ') subArray.push(text);
                        break;
                    case 22:
                        if (text !== ' ') thirdArray.push(text);
                        break;
                }
            }
        },
        onclosetag: function(tagname) {
            level--;
            if (level < tableLevel && flag === true) {
                flag = false;
            }
            // console.log(tagname.green);
        },
        onend: function() {
            // for (var i = 0; i < tree.length; i++) {
            //     for (var j in sharedObject['subjectList']) {
            //         if (sharedObject['subjectList'][j] === tree[i].subject) {
            //             tree[i].code = j;
            //         }
            //     }
            // }
            // sharedObject.courseTree = tree;
            // console.log(sharedObject.courseTree);
            sharedObject.course = course;
            deferred.resolve(sharedObject);
            // console.log(util.inspect(tree, { showHidden: false, depth: null }));
        },
    }, { decodeEntities: true });
    parser.write(sharedObject.courseRawData);
    parser.end();

    return deferred.promise;
}

getCourses('yb3', 'Rijn_147268')
    .then(parseData)
    .then(generateICS)
    .done();

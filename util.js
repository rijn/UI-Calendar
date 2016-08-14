module.exports = {

    combineCookies: function(newCookie, sharedObject) {
        if (newCookie) {
            for (var i = 0; i < newCookie.length; i++) {
                newCookie[i] = newCookie[i].split(';')[0];
            }
        }
        for (var i in newCookie) {
            var key = newCookie[i].split('=')[0];
            for (var j = 0; j < sharedObject.cookie.length; j++) {
                if (sharedObject.cookie[j].indexOf(key) >= 0) {
                    sharedObject.cookie[j] = newCookie[i];
                    key = 'COOKIEFLAG';
                }
            }
            if (key != 'COOKIEFLAG') {
                sharedObject.cookie.push(newCookie[i]);
            }
        }
    },

    getConfig: function() {
        var defaultConfig = require('./config.default');
        var config = defaultConfig;

        var arguments = process.argv.splice(2);

        try {
            var userConfig = require('./config');
        } catch (e) {
            console.log('Could not find user config');
            return;
        }

        for (var i in defaultConfig) {
            if (userConfig.hasOwnProperty(i)) {
                config[i] = userConfig[i];
            }
        }

        return config;
    },

    throwErr: function(err) {
        const colors = require('colors');
        console.log('\n', err.red);
        throw err;
    },

    colorSetTheme: function(colors) {
        colors.setTheme({
            info: 'green',
            data: 'grey',
            help: 'cyan',
            warn: 'yellow',
            debug: 'blue',
            error: 'red',
            request: 'cyan',
            result: 'green',
        });
    },
};

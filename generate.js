const Q = require('q');

Date.prototype.Format = function(fmt) { //author: meizz
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

module.exports = function(sharedObject) {

    var deferred = Q.defer();

    var ical = require('ical-generator'),
        cal = ical({
            domain: 'rijnx.com',
            name: 'UI',
            prodId: { company: 'rijnx.com', product: 'UI Clandar' },
            // timezone: 'America/Chicago'
        }).ttl(60 * 60 * 24);;

    // overwrite domain
    cal.domain('rijnx.com');


    var arr = sharedObject.course;

    var weekRemap = {
        'M': 'MO',
        'T': 'TU',
        'W': 'WE',
        'R': 'TH',
        'F': 'FR',
    }

    var now = new Date('2016-08-21');
    var nowTime = now.getTime();
    var oneDayLong = 24 * 60 * 60 * 1000;

    var firstWeekday = {
        'MO': new Date(nowTime + 1 * oneDayLong).Format('yyyy-MM-dd'),
        'TU': new Date(nowTime + 2 * oneDayLong).Format('yyyy-MM-dd'),
        'WE': new Date(nowTime + 3 * oneDayLong).Format('yyyy-MM-dd'),
        'TH': new Date(nowTime + 4 * oneDayLong).Format('yyyy-MM-dd'),
        'FR': new Date(nowTime + 5 * oneDayLong).Format('yyyy-MM-dd')
    }

    for (var i = 0; i < arr.length; i++) {
        var temp = arr[i];
        for (var j = 0; j < temp[5].length; j++) {
            temp[5][j] = weekRemap[temp[5][j]];
        }
        cal.createEvent({
            start: new Date(firstWeekday[temp[5][0]] + ' ' + temp[2]),
            end: new Date(firstWeekday[temp[5][0]] + ' ' + temp[3]),
            timezone: 'America/Chicago',
            summary: temp[0] + ' - ' + temp[1],
            description: temp[4],
            location: temp[4],
            // floating: true,
            repeating: {
                freq: 'WEEKLY', // required
                until: new Date('2016-12-08'),
                byDay: temp[5],
            }
        });
    }

    sharedObject.ics = cal.toString();
    // console.log(cal.toString());

    // console.log(sharedObject.course);
    deferred.resolve(sharedObject);
    return deferred.promise;
}

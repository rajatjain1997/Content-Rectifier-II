var data = require('../data/URLBlocker.js');
var md5 = require('md5');
var lfu = require('lfu-cache')(1000, 3600*24*10);

export {
    checkPresenceInTrusted, add
};

var trustedElementsArray = data.trustedElementsArray;

function checkPresenceInTrusted(url) {
    // checks the presence of url in
    // 1. trustedElementsArray
    // 2. trustedURLs (from chrome local storage)
    return new Promise(function(resolve, reject){
        var str;
        if(url) {
            str = url;
        } else {
            reject("Bad URL");
            return;
        }
        for (var i in trustedElementsArray) {
            if (trustedElementsArray[i] == str) {
                resolve(true);
                return;
            }
        }
        chrome.storage.local.get(['settings', 'global'], function(items) {
            var localTrustedCache = items.global.trustedURLs;
            lfu.import(localTrustedCache);
            if(getLFUCache(str)) {
                resolve(true);
                return;
            }
            if(items.global.trustedURLObj[md5(str)]) {
                resolve(true);
                return;
            }
            resolve(false);
            return;
        });
    });
}

function add(url) {
    setLFUCache(url);
    chrome.storage.local.get(['settings', 'global'], function(items) {
        items.global.trustedURLs = lfu.export();
        chrome.storage.local.set({
            global: items.global
        });
        //console.log("added a new URL to trusted sites: " + url);
    });
    //Server call goes here
}

function setLFUCache(url) {
    lfu.set(md5(url),{url: url});
}

function getLFUCache(url) {
    return lfu.get(md5(url));
}

lfu.on('eviction', function(key, object) {
    chrome.storage.local.get(['settings', 'global'], function(items) {
        items.global.trustedURLObj[key] = object["url"];
        chrome.storage.local.set({
            global: items.global
        });
        //console.log("added a new URL to trusted sites: " + url);
    });
});

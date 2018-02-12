// description: after installing Puppeteer v1+, redoing the whole scraper. might be merged back later.
// largely based on the earhart fellows pattern, but using logic from udacity-employment.js as well
// also based on email-append-repec
// earhart fellows follows a stream pattern, this doesnt
// TODO: compare subsample pattern vs working backwards from genderize available names
// TODO: only get sUrl if valid data is not in the cache
//      valid data includes not a private profile
// TODO: add other data to cache such as genderized name
// TODO: get more data like linkedIn stuff
// ref: https://www.quora.com/How-do-setup-IP-rotation-for-my-web-crawler
// ref: https://scrapinghub.com/crawlera
// ref: http://www.engrjpmunoz.com/5-tools-everyone-in-the-data-scraper-industry-should-be-using/

'use strict'

/*** boilerplate pretty much: TODO: extract to lib ***/

const Apify = require('apify');
const beautify = require('js-beautify').js_beautify;
const EOL = require('os').EOL;
const fs = require('fs');
const reorder = require('csv-reorder');
const puppeteer = require('puppeteer');
const util = require('util');
const utils = require('ella-utils');

const oTitleLine = {
    'sId': 'Entry ID',
    'sEmail': 'Email Address',
    'sUserName': 'Username',
    'sLocation': 'Location',
    'iEducationCount': 'Count of Education Entries',
    'sLinkedInUrl': 'LinkedIn Url',
    'sResumeUrl': 'Resume Url',
    'bUserExists': 'User Exists',
    'bProfileIsPrivate': 'Profile is Private',
    'bTooManyRequestsError': 'Scrape Blocked for Too Many Requests',
    'bOtherError': 'Other Error',
    'bPresentlyEmployed': 'Presently Employed',
    'sProfileLastUpdate': 'Profile Last Updated Date',
    'sUrl': 'Url Source'
};

const arrTableColumnKeys = Object.keys(oTitleLine);
const sCacheUrl = 'https://raw.githubusercontent.com/Vandivier/udacity-apify/master/kv-store-dev/OUTPUT';
const sRootUrl = 'https://profiles.udacity.com/u/';

let oCache;
let browser;
let bShortRun = true;   // if false, find all valid bUserExists even though we can't scrape. If true, just end the run when we can't scrape.
                        // save time and computing power with true; you don't always want to do this, so configure bShortRun per run
let bTooManyRequestsDuringThisRun = false;
let iCurrentInputRecord = 0;
let iTotalInputRecords = 0;
let sResultToWrite;
let wsGotSome;
let wsErrorLog;

Apify.main(async () => {
    await main();
});

async function main() {
    let arrsFirstNames;

    //await utils.fpWait(5000); // for debugging
    browser = await Apify.launchPuppeteer(); // ref: https://www.apify.com/docs/sdk/apify-runtime-js/latest

    await fpGetCache();
    arrsFirstNames = oCache.firstNames;
    //debugger // for debugging
    console.log('first names', arrsFirstNames);

    // array pattern, doesn't work for streams
    await utils.forEachReverseAsyncPhased(arrsFirstNames, async function(_sInputRecord, i) {
        const oRecordFromSource = { // oRecords can be from source or generated; these are all from source
            sFirstName: _sInputRecord,
            sLastName: 'smith', // todo: change
            iModifiedIncrement: 0
        };

        return fpHandleData(oRecordFromSource);
    });

    return fpEndProgram();
}

async function fpGetCache() {
    const _page = await browser.newPage();
    await _page.goto(sCacheUrl, {
        'timeout': 0
    });

    await _page.content();
    oCache = await _page.evaluate(() => {
        return JSON.parse(document.querySelector("body").innerText); 
    });
    await _page.close();

    return Promise.resolve();
}

// to limit reference errors, only these things should ever be passed in through oMinimalRecord:
// first name, last name, modified increment
// increment username to generate a new guessed username and try again until verified failure; udacity username business rule
// TODO: not just first name, but try firstlast and maybe last too
async function fpHandleData(oMinimalRecord) {
    const oRecord = JSON.parse(JSON.stringify(oMinimalRecord)); // dereference for safety, shouldn't be needed tho
    let _oScrapeResult;

    oRecord.sId = oRecord.sFirstName
        + (oRecord.iModifiedIncrement || ''); // '0' shouldn't appear

    oRecord.sUrl = sRootUrl
        + oRecord.sId;

    _oScrapeResult = await fpScrapeInputRecord(oRecord);
    if (_oScrapeResult.bUserExists) { // deceptively simple, dangerously recursive
        await fpHandleData({
            sFirstName: _oScrapeResult.sFirstName,
            sLastName: _oScrapeResult.sLastName,
            iModifiedIncrement: (_oScrapeResult.iModifiedIncrement + 1)
        });
    }

    iCurrentInputRecord++;
    console.log('scraped input record #: ' +
        iCurrentInputRecord +
        '/' + iTotalInputRecords +
        EOL);

    return Promise.resolve();
}

function fsRecordToCsvLine(oRecord) {
    utils.fsRecordToCsvLine(oRecord, arrTableColumnKeys, wsWriteStream);
}

async function fpEndProgram() {
    await browser.close();
    await Apify.setValue('OUTPUT', oCache);
    return Promise.resolve();
}

/*** end boilerplate pretty much ***/

// not generalizable or temporally reliable in case of a site refactor
async function fpScrapeInputRecord(oRecord) {
    let oCachedResult = oCache.people[oRecord.sId];
    let oMergedRecord = {};
    let oScrapeResult = {};
    let _page;

    //debugger

    if (oCachedResult
        && (oCachedResult.bProfileIsPrivate
            || !oCachedResult.bTooManyRequestsError)
        && oCachedResult.bUserExists !== undefined)
    {
        oScrapeResult = JSON.parse(JSON.stringify(oCachedResult));
    } else if (oRecord.bUserExists !== false // yes, an exact check is needed.
               && !(bTooManyRequestsDuringThisRun
                   && bShortRun)
              )
    {
        _page = await browser.newPage();
        await _page.goto(oRecord.sUrl, {
            'timeout': 0
        });

        await _page.content();
        _page.on('console', _fCleanLog); // ref: https://stackoverflow.com/a/47460782/3931488

        oScrapeResult = await _page.evaluate(async function (_iCurrentInputRecord) {
            const script = document.createElement('script') // inject jQuery
            script.src = 'https://code.jquery.com/jquery-3.3.1.js'; // inject jQuery
            document.getElementsByTagName('head')[0].appendChild(script); // inject jQuery
            console.log('scraping: ' + window.location.href);

            // toast message will disappear if you wait too long
            await _fpWait(1000);

            var arr$Affiliations = $('#affiliation-body a[name=subaffil]');
            var sarrAffiliations = '';
            var _oResult = {
                'bUserExists': $('[class*=profile-container]').length > 0,
                'bProfileIsPrivate': $('[class*="toast--message"]').html() === 'Profile is private',
                'bTooManyRequestsError': _fsSafeTrim($('[class*="toast--message"]').html()) === 'Too many requests'
            };

            // wait a bit longer for UI to render if it is a valid scrape target
            if (!_oResult.bProfileIsPrivate
                && !_oResult.bTooManyRequestsError)
            {
                await _fpWait(4000);

                _oResult.sUserName = $('h1[class*="user--name"]').html();
                _oResult.sLocation = $('[alt="location marker"]').next().html();
                _oResult.sEmail = $('.emaillabel').parent().find('td span').text();
                _oResult.iEducationCount = $('div[class*="educations--section"] div[class*="_education--education"]').length;
                _oResult.sLinkedInUrl = $('a[title="LINKEDIN"]').attr('href');
                _oResult.sResumeUrl = $('a[title="Resume"]').attr('href');
                _oResult.bOtherError = false;
                _oResult.bPresentlyEmployed = $('div[class*="works--section"] div[class*="_work--work"] span[class*="_work--present"]').length > 0;
                _oResult.sProfileLastUpdate = $('div[class*="profile--updated"]').text();

                arr$Affiliations && arr$Affiliations.each(function (arr, el) {
                    let sTrimmed = _fsSafeTrim(el.innerText.replace(/\s/g, ' '));
                    _oResult.sarrAffiliations += ('~' + sTrimmed);
                });
            }

            return Promise.resolve(_oResult);

            // larger time allows for slow site response
            // some times of day when it's responding fast u can get away
            // with smaller ms; suggested default of 12.5s
            async function _fpWait (ms) {
                ms = ms || 10000;
                return new Promise(resolve => setTimeout(resolve, ms));
            }

            function _fsSafeTrim (s) {
                return s && s.replace(/[,"]/g, '').trim();
            }
        })
        .catch(function (error) {
            if (error.message.includes('Execution context was destroyed')) {
                // context was destroyed by http redirect to 404 bc user doesn't exist.
                // well, that's the usual scenario. One can imagine a host of other causes too.
                return {
                    'bUserExists': false
                }
            }

            console.log('unknown _page.evaluate err: ', error);

            return {
                'bOtherError': true
            };
        });

        await _page.close();
        if (oScrapeResult.bTooManyRequestsError) bTooManyRequestsDuringThisRun = true;
    }

    oMergedRecord = Object.assign(oRecord, oScrapeResult);
    oCache.people[oRecord.sId] = JSON.parse(JSON.stringify(oMergedRecord));
    return Promise.resolve(JSON.parse(JSON.stringify(oRecord))); // return prior to merging to minimize invalid data passed on

    function _fCleanLog(ConsoleMessage) {
        if (ConsoleMessage.type() === 'log') {
            console.log(ConsoleMessage.text() + EOL);
        }
        if (ConsoleMessage.type() === 'error'
            || ConsoleMessage.text().includes('fpScrapeInputRecord err'))
        {
            console.log(ConsoleMessage);
        }
    }
}

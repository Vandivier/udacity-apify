# Udacity-Apify

Originally cloned from: https://github.com/apifytech/act-quick-start

# Known Issues

1. https://profiles.udacity.com/u/elizabeth6 says bUserExists = false, but we have name and location!
2. https://profiles.udacity.com/u/john5 says "bProfileIsPrivate": false, but accessing now it says profile is private (time issue?)

# Results WIP

1. refer to data-science-practice / python / udacity-postprocess
2. result 1: 2/19/18, employment-population ratio is .5, less than expected as the US is normally around .6
    1. possible explanation: US employment-population ratio only considers those above age 16; udacity has no such filter
    2. possible remedy: only consider those with some education or work experience as a rough indicator of age
    3. note: we would need to make the correction on both sides: finding US data with some education or work experience

# TODO

1. Nickname groups, referring to https://deron.meranda.us/data/nicknames.txt
2. Other platforms other than udacity (in-scope for business project, out-of-scope for this NPM project / repo)
3. Measure temporal variation: See known issues #2. Can accomplish by comparing common keys in OUTPUT 1.0 vs 1.1

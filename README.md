# Udacity-Apify

Originally cloned from: https://github.com/apifytech/act-quick-start

# Known Issues

1. https://profiles.udacity.com/u/elizabeth6 says bUserExists = false, but we have name and location!
2. https://profiles.udacity.com/u/john5 says "bProfileIsPrivate": false, but accessing now it says profile is private (time issue?)
3. at one point michael5 said bProfilePrivate, but then it said bProfilePrivate=false and reported all falsy data; so no employed/0/0 may be an error artifact

# Results WIP

1. refer to data-science-practice / python / udacity-postprocess
2. result 1: 2/19/18, employment-population ratio is .5, less than expected as the US is normally around .6
    1. possible explanation: US employment-population ratio only considers those above age 16; udacity has no such filter
    2. possible remedy: only consider those with some education or work experience as a rough indicator of age
    3. note: we would need to make the correction on both sides: finding US data with some education or work experience
3. Out-of-country data seems to have very high employment, eg Australia and UK, so this doesn't seem to explain the delta or need priority correction
    4. but we can do eventual correction and it's ez. we can even break down results by state or country

# TODO

1. Nickname groups, referring to https://deron.meranda.us/data/nicknames.txt
2. Other platforms other than udacity (in-scope for business project, out-of-scope for this NPM project / repo)
3. Measure temporal variation: See known issues #2. Can accomplish by comparing common keys in OUTPUT 1.0 vs 1.1
4. Validate initial data by hand: experience and education for linda: "https://profiles.udacity.com/u/linda1"

# Related literature

1. http://hechingerreport.org/college-degree-outdated/
2. The Case Against Education, Caplan

# Platforms of interest

1. Udacity
2. Coursera
3. Udemy
4. PluralSight
5. Codecademy
6. Degreed
7. AlternativesTo and Integrations (eg Code School, Alison, Lynda, treehouse)
8. https://www.g2crowd.com/categories/online-course-providers
9. stackoverflow

# platforms invalidated
  1. khan academy doesn't expose labor data
  2. degreed "
  3. udemy "
  5. hubspot "
  6. datacamp "
  4. coursera: unable to programmatically determine user profile page*
  5. pretty much everything: new approach http://advangle.com/
     1. pay for linda
     2. pay for linkedIn
     3. use my own linkedIn network (bias potential)
     4. *use a search engine instead of my own scraper (advangle-inurl pattern, bing > google)
     5. "second hand scrape" pattern to determine valid user profiles

# Business Project Notes

1. Barriers to entry: some providers are paid, eg lynda 20/mo
2. 

# Key Terms

1. Validated Learning
2. Evidence-based learning
3. skill certification
4. 

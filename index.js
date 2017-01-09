const cheerio = require('cheerio');
const request = require('request');
const fs = require('fs');

const baseURL = "http://www.cs.sfu.ca/~ashriram/Courses/2017/CS300/";
const url = "http://www.cs.sfu.ca/~ashriram/Courses/2017/CS300/includes/schedule.html";
const baseDir = process.argv[2];

if (!fs.existsSync(baseDir)) {
  fs.mkdirSync(baseDir);
}

function resolveLinks(links, callback) {
  var dir;

  links.forEach(function resolveSingleLink(link, index) {
    var folderName = link.match(/.Week/i);
    if (folderName) {
      folderName = link.slice(folderName.index + 1, link.length - 1);
    }

    dir = baseDir + folderName;

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    callback(link, dir);
  });
}

function requestPDF(link, dir) {
  request(link, function openLink(err, response, body) {
    // process.chdir(dir);
    if (err) return console.error(err);

    $ = cheerio.load(body);

    $anchorTags = $('a');

    $anchorTags.each(function downloadPDFS(index, element) {
      if ($(element).attr('href').match(/^[a-z0-9_-]+\.*[a-z0-9_-]+$/i)) {
        var file = fs.createWriteStream($(element).attr('href'));

        request(link + $(element).attr('href'), function(err, response, body) {
            response.pipe(file);
        });
      }

      if ($(element).attr('href').match(/^[/a-z]+[/]$/i)) {
        var directoryName = $(element).attr('href').slice(0, $(element).attr('href').length - 2);
        var subLink = link + $(element).attr('href');

        if (!fs.existsSync(directoryName)) {
            fs.mkdirSync(directoryName);
        }
        directoryName = dir + '/' + directoryName;

        requestPDF(subLink, directoryName);
      }
    });
  });
}

function getLinks(callback, secondcallback) {
  var linksToFollow = [];
  request(url, function openBaseURL(err, response, body) {
    if (err) return console.error(err);

    $ = cheerio.load(body);

    $("table table table a").each(function pushLinks(index, element) {
      var $linkTag = $(element);

      if ($linkTag.attr('href').match(/\.\.slides\//i)) {
        let cleanedAttr = $linkTag.attr('href').slice(3);
        let changeURL = baseURL + cleanedAttr;
        linksToFollow.push(changeURL);
      }
    });

    callback(linksToFollow, secondcallback);
  });
}

getLinks(resolveLinks, requestPDF);

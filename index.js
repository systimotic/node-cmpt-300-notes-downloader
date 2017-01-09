const cheerio = require('cheerio');
const request = require('request');
const fs = require('fs');

// var url = "http://www.cs.sfu.ca/~ashriram/Courses/2017/CS300/slides/Week2/Examples/";
// var dir = "/home/bear/Desktop/cmpt-300/Week 2";
var baseURL = "http://www.cs.sfu.ca/~ashriram/Courses/2017/CS300/";
var url = "http://www.cs.sfu.ca/~ashriram/Courses/2017/CS300/includes/schedule.html";
var baseDir = process.argv[2];
if (!fs.existsSync(baseDir)) {
  fs.mkdirSync(baseDir);
}
//var baseDir = "/home/bear/Desktop/cmpt-300";
//baseDir = "/home/bear/Desktop/grab_files";
function resolveLinks(links, callback) {
  // console.log(link);
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
    //console.log(link);
    process.chdir(dir);
    //console.log(process.cwd());
    if (err) return console.log(error);

    $ = cheerio.load(body);

    $anchorTags = $('a');

    $anchorTags.each(function downloadPDFS(index, element) {
      if ($(element).attr('href').match(/^[a-zA-Z0-9_-]+\.*[a-zA-Z0-9_-]+$/i)) {
        //console.log(link + $(element).attr('href'));
        var file = fs.createWriteStream($(element).attr('href'));
        request(link + $(element).attr('href'), function(err, response, body) {
            response.pipe(file);
        });
        // //request('http://unec.edu.az/application/uploads/2014/12/pdf-sample.pdf').pipe(fs.createWriteStream('test.pdf'));
      }
      if ($(element).attr('href').match(/^[/a-zA-Z]+[/]$/i)) {
        //console.log(link + $(element).attr('href'));
        var directoryName = $(element).attr('href').slice(0, $(element).attr('href').length - 2);
        var subLink = link + $(element).attr('href');
        if (!fs.existsSync(directoryName)) {
            fs.mkdirSync(directoryName);
        }
        directoryName = dir + '/' + directoryName;
        //console.log(directoryName);
        requestPDF(subLink, directoryName);
      }
    });
  });
}

function getLinks(callback, secondcallback) {
  var linksToFollow = [];
  request(url, function openBaseURL(err, response, body) {
    if (err) return console.log(error);

    $ = cheerio.load(body);

    $("table table table a").each(function pushLinks(index, element) {
      var $linkTag = $(element);

      if ($linkTag.attr('href').match(/..slides\//i)) {
        let cleanedAttr = $linkTag.attr('href').slice(3);
        let changeURL = baseURL + cleanedAttr;
        linksToFollow.push(changeURL);
      }
    });
    callback(linksToFollow, secondcallback);
  });
}

getLinks(resolveLinks, requestPDF);

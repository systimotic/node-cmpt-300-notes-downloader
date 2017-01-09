const cheerio = require('cheerio');
const request = require('request');
const fs = require('fs');
const path = require('path');


function createDirectory(name, callback) {
  if (!fs.existsSync(name)) {
    return fs.mkdirSync(name);
  }
}


function getNotes(url, directory) {
  request(url, (err, response, body) => {
    if (err) return console.error(err);

    const $ = cheerio.load(body);

    const $links = $('a');
    const $linkSelection = $links.slice(5, $links.length - 1); // remove unwanted default links

    $linkSelection.each((index, element) => {
      const linkURL = $(element).attr('href');
      const fullURL = url + linkURL;
      const nextLocation = path.join(directory, linkURL);

      if (linkURL.includes('/')) {
        createDirectory(nextLocation);
        return getNotes(fullURL, nextLocation);
      }

      download(fullURL, nextLocation);
    });
  });
}

function download(url, location) {
  const file = fs.createWriteStream(location);

  request(url)
    .pipe(file)
    .on('error', function(error){
      console.error(error);
    });
}


const indexURL = "http://www.cs.sfu.ca/~ashriram/Courses/2017/CS300/slides/";
const baseDirectory = process.argv[2] || path.join(__dirname, 'data');

createDirectory(baseDirectory);
getNotes(indexURL, baseDirectory);

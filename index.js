const cheerio = require('cheerio');
const request = require('request');
const fs = require('fs');
const path = require('path');

const baseURL = "http://www.cs.sfu.ca/~ashriram/Courses/2017/CS300/";
const scheduleURL = "http://www.cs.sfu.ca/~ashriram/Courses/2017/CS300/includes/schedule.html";
const baseDirectory = process.argv[2] || path.join(__dirname, 'data');


function createDirectory(name, callback) {
  if (!fs.existsSync(name)) {
    return fs.mkdirSync(name);
  }
}

createDirectory(baseDirectory);


function getWeeks() {
  request(scheduleURL, (err, response, body) => {
    if (err) return console.error(err);

    let links = [];
    let directories = [];

    const $ = cheerio.load(body);

    $('table table table a').each((index, element) => {
      const linkURL = $(element).attr('href');

      if (linkURL.match(/\.\.\/slides\//i)) {
        const formattedURL = linkURL.slice(3); // removes ../
        const fullURL = baseURL + formattedURL;

        const directoryName = formattedURL.slice(7); // removes slides/
        const directory = path.join(baseDirectory, directoryName);
        createDirectory(directory);

        getNotes(fullURL, directory);
      }
    });
  });
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

getWeeks();

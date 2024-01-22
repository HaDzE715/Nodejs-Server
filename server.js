const http = require('http');
const fs = require('fs');
let html = fs.readFileSync('./Templates/index.html', 'utf-8');
let shelters = JSON.parse(fs.readFileSync('./data.json', 'utf-8')); // To read the file only once, JSON.PARSE to Convert data to javascript object notation 
let SheltersListHTML = fs.readFileSync('./Templates/shelter-list.html', 'utf-8');
let ReadmeHTML = fs.readFileSync('./Templates/readme.html', 'utf-8');

let SheltersHTMLArr = shelters.map((shel) => {
  let output = SheltersListHTML.replace('{{%NAME%}}', shel.name);
  output = output.replace('{{%LOCATION%}}', shel.location);
  output = output.replace('{{%CAPACITY%}}', shel.capacity);

  return output;
})

const server = http.createServer((req, res) => { // Creatnig server using http.createServer passing request and response
  if (req.method === 'GET' && (req.url === '/' || req.url === '/home')) {
    res.writeHead(200, {
      'Content-Type': 'text/html',
      'my-header': 'Hello, world'
    });
    res.end(html.replace('{{%%CONTENT%%}}', ReadmeHTML));
    return; // Return to prevent more execution
  }
  if (req.method === 'GET' && req.url === '/Style/style.css') {
    res.writeHead(200, {
      'Content-Type': 'text/css'
    });
    const cssContent = fs.readFileSync('./Style/style.css', 'utf-8');
    res.end(cssContent);
    return;
  }
  if (req.method === 'GET' && req.url === '/Shelters') {
    let ShelterResponseHtml = html.replace('{{%%CONTENT%%}}', SheltersHTMLArr.join(''))
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write(ShelterResponseHtml);
    res.end();
    return;
  }
  if (req.method === 'GET' && req.url === '/SheltersJSON') {
    const SheltersJSON = fs.readFileSync('./data.json', 'utf-8');
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(SheltersJSON);
    return;
  }
  else if (req.method === 'POST' && req.url === '/CreateShelter') {
    let requestBody = '';

    req.on('data', (chunk) => {
      requestBody += chunk;
    });

    req.on('end', () => {
      try {
        let requestData;

        if (req.headers['content-type'] === 'application/json') // Handle requests comes from postman
          requestData = JSON.parse(requestBody);

        if (req.headers['content-type'] === 'application/x-www-form-urlencoded') // Handle requests comes from the browser
        {
          const querystring = require('querystring');
          requestData = querystring.parse(requestBody);
        }
        const { name, location, capacity } = requestData;

        let lastId = shelters.length > 0 ? shelters[shelters.length - 1].id : 0; // Auto increment for id field
        const newShelter = {
          id: (parseInt(lastId) + 1),
          name: name || 'Default name',
          location: location || "Default Location",
          capacity: capacity || 0
        }
        shelters.push(newShelter);
        fs.writeFileSync('./data.json', JSON.stringify(shelters, null, 2));
        console.log('New shelter added successfully.');
      } catch (error) {
        console.error('Error parsing JSON: ', error.message);
      }

      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Shelter created successfully');
    });
  }
  else if (req.method == 'GET' && req.url == '/ShelterCreation') {
    const createShelterHTML = fs.readFileSync('./Templates/create-shelter.html', 'utf-8');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html.replace('{{%%CONTENT%%}}', createShelterHTML));
    return;
  }
  else if (req.method === 'PUT' && req.url.startsWith('/updateShelter')) {
    const shelterId = req.url.split('/')[2];
    const index = shelters.findIndex(shelter => shelter.id == shelterId);
    let updatedShelter;

    if (index !== -1) {
      updatedShelter = {
        id: shelterId,
        name: "Updated Shelter",
        location: "Updated Location",
        capacity: 200
      }
    };
    shelters[index] = updatedShelter;
    fs.writeFileSync('./data.json', JSON.stringify(shelters, null, 2));

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`Shelter with ID ${shelterId} updated successfully`);
  }
  else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end(`Not Found`);
  }
});

const PORT = 3000;
const IP = '127.0.0.1';

server.listen(PORT, IP, () => { // Listening to the server on the PORT and IP that we provided.
  console.log(`Server running at http://${IP}:${PORT}/`);
});

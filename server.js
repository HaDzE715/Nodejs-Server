const http = require('http');
const fs = require('fs');
const url = require('url');
const querystring = require('querystring');

let html = fs.readFileSync('./Templates/index.html', 'utf-8');
let shelters = JSON.parse(fs.readFileSync('./data.json', 'utf-8')); // To read the file only once, JSON.PARSE to Convert data to javascript object notation 
let SheltersListHTML = fs.readFileSync('./Templates/shelter-list.html', 'utf-8');
let ReadmeHTML = fs.readFileSync('./Templates/readme.html', 'utf-8');

let SheltersHTMLArr = shelters.map((shel) => {
  let output = SheltersListHTML.replace('{{%ID%}}', shel.id);
  output = output.replace('{{%NAME%}}', shel.name);
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
    let name;
    let location;
    let capacity;

    req.on('data', (chunk) => {
      requestBody += chunk;
    });

    req.on('end', () => {
      try {
        let requestData;

        if (req.headers['content-type'] === 'application/x-www-form-urlencoded') // Handle requests comes from the browser
        {
          const querystring = require('querystring');
          requestData = querystring.parse(requestBody);
          console.log(requestData);
          name = requestData.name;
          location = requestData.location;
          capacity = requestData.capacity;
        }
        if (req.headers['content-type'] === 'application/json') { // Handle requests comes from postman
          requestData = JSON.parse(requestBody);
          name = requestData[0].name;
          location = requestData[0].location;
          capacity = requestData[0].capacity;
        }


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
  else if (req.method == 'GET' && req.url == '/ShelterCreation') { // HTML response for creating a shelter
    const createShelterHTML = fs.readFileSync('./Templates/create-shelter.html', 'utf-8');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html.replace('{{%%CONTENT%%}}', createShelterHTML));
    return;
  }
  else if (req.method == 'GET' && req.url == '/ShelterUp') { // HTML response for creating a shelter
    const updateShelterHTML = fs.readFileSync('./Templates/update-shelter.html', 'utf-8');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html.replace('{{%%CONTENT%%}}', updateShelterHTML));
    return;
  }
  else if (req.method == 'GET' && req.url == '/ShelterDel') {
    const deleteShelterHTML = fs.readFileSync('./Templates/delete-shelter.html', 'utf-8');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html.replace('{{%%CONTENT%%}}', deleteShelterHTML));
  }
  else if (req.method === 'PUT' && req.url.startsWith('/ShelterUpdate/')) {
    let shelterId = req.url.split('/')[2];
    let index = shelters.findIndex(shelter => shelter.id == shelterId);
    let updatedShelter;

    if (index !== -1) {
      let requestBody = '';

      req.on('data', (chunk) => {
        requestBody += chunk;
      });

      req.on('end', () => {
        try {
          let requestData = JSON.parse(requestBody);

          // Check if the required fields are present in requestData
          if ('name' in requestData && 'location' in requestData && 'capacity' in requestData) {
            updatedShelter = {
              id: shelterId,
              name: requestData.name,
              location: requestData.location,
              capacity: requestData.capacity
            };

            shelters[index] = updatedShelter;
            fs.writeFileSync('./data.json', JSON.stringify(shelters, null, 2));

            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end(`Shelter with ID ${shelterId} updated successfully`);
          } else {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Bad Request: Missing required fields');
          }
        } catch (error) {
          console.error('Error parsing request data:', error.message);
          res.writeHead(400, { 'Content-Type': 'text/plain' });
          res.end('Bad Request: Invalid data format');
        }
      });
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end(`Shelter with ID ${shelterId} not found`);
    }
  }
  else if (req.method === 'DELETE' && req.url.startsWith('/ShelterDelete/')) {
    let shelterId = req.url.split('/')[2];
    let index = shelters.findIndex(shelter => shelter.id == shelterId);

    if (index !== -1) {
      shelters.splice(index, 1); // Remove the shelter from the array
      fs.writeFileSync('./data.json', JSON.stringify(shelters, null, 2));

      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(`Shelter with ID ${shelterId} deleted successfully`);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end(`Shelter with ID ${shelterId} not found`);
    }
}
});

const PORT = 3000;
const IP = '127.0.0.1';

server.listen(PORT, IP, () => { // Listening to the server on the PORT and IP that we provided.
  console.log(`Server running at http://${IP}:${PORT}/`);
});

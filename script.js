// Fetch shelters data from the server
fetch('/getShelters')
    .then(response => response.json())
    .then(shelters => displayShelters(shelters))
    .catch(error => console.error('Error fetching shelters:', error));

// Function to display shelters on the HTML page
function displayShelters(shelters) {
    const shelterListContainer = document.getElementById('shelterList');

    shelters.forEach(shelter => {
        const shelterDiv = document.createElement('div');
        shelterDiv.innerHTML = `<strong>${shelter.name}</strong><br>${shelter.location}<br>Capacity: ${shelter.capacity}<br><br>`;
        shelterListContainer.appendChild(shelterDiv);
    });
}

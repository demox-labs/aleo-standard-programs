const fs = require('fs');

// Function to load data from the JSON file
function loadData(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        const jsonData = JSON.parse(data);
        return jsonData;
    } catch (err) {
        console.error('Error reading or parsing file:', err);
    }
}

// Call the function with the path to your JSON file
const filePath = './mainnet-data.json'; // Adjust the file path as needed
const data = loadData(filePath);

function analyzeData(data) {
    const snapshots = data.result;
    const totalSnapshots = snapshots.length;
    console.log('Total snapshots:', totalSnapshots);
    let previousRatio = 0;
    for (let i = 0; i < totalSnapshots; i++) {
        const snapshot = snapshots[i];
        const ratio = Number(snapshot.pondoTVL) / Number(snapshot.paleoSupply);
        const change = ratio - previousRatio;
        console.log(`Snapshot ${i + 1}: ${ratio}`);
        if (change < 0) {
          console.log('Ratio decreased from the previous snapshot');
          console.log(snapshot);
          console.log(snapshots[i - 1]);
        }
        previousRatio = ratio;
    }
}

// Call the analyzeData function with the pondo data
analyzeData(data);
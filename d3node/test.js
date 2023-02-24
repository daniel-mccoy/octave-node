const fs = require('fs');
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv)).argv

const getModels = () => {
    const jsonPath = "../public/json/"
    let models = [];
    if (argv._) { models = argv._; }
    if (argv.model && !models.includes(argv.model)) { models.push(argv.model); }
    if (!models.length) {
        const jsonFile = jsonPath + "models.json";
        const modelsJson = fs.readFileSync(jsonFile)
        const modelsObj = JSON.parse(modelsJson);
        Object.values(modelsObj).forEach(m => { models.push(m.name); });
    }
    return models;
}

const models = getModels();
if (models.length) {
    models.forEach(model => {
        console.log(model);
    });
} else {
    console.log("No models found.");
}

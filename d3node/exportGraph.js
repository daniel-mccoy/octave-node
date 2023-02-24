const D3Node = require('d3-node');
const fs = require('fs');

const d3n = new D3Node()
d3n.createSVG(10,20).append('g');
const svgFile = d3n.svgString();
const filePath = './public/img/graph/test.svg';

fs.writeFile(filePath, svgFile, function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("The file was saved!");
});

const fs = require('fs');
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv)).argv
const D3Node = require('d3-node');

const webRoot = "/";
const blankPNG = webRoot + "img/blank.png";
const margin = {
            top: 30,
            right: 30,
            bottom: 70,
            left: 30
        }
const boxWidth = 800;
const boxHeight = 800;
const maxRadius = 30;
const minRadius = 3;
let nodePadding = 25;

const generateGraph = (modelName) => {
    const d3n = new D3Node() // initializes D3 with container element
    const d3 = d3n.d3
    const jsonPath = "./public/json/" + modelName + "/";
    const cloudPath = webRoot + "img/plot/" + modelName + "/";
    const graphDir = "./public/img/graph/" + modelName + "/";
    const graphJSON = jsonPath + "graph_" + modelName + ".json";
    const svg = d3n.createSVG(boxWidth, boxHeight);
    const network = svg.append("g")
       // .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .attr("id", "network");

    const graphObj = fs.readFileSync(graphJSON)
    let graph = JSON.parse(graphObj);
    let linkedByIndex = {};
    graph.links.forEach(l => {
        linkedByIndex[`${l.source},${l.target}`] = true;
    });

    const minDegree = d3.min(
        Object.values(graph.nodes), function (d) {
            return d.degree;
        })
    const maxDegree = d3.max(
        Object.values(graph.nodes), function (d) {
            return d.degree;
        })
    const nodeScale = d3.scaleSqrt()
        .domain([minDegree, maxDegree])
        .range([minRadius, maxRadius]);

    const simulation = d3.forceSimulation()
        .force("x", d3.forceX(boxWidth / 2))
        .nodes(graph.nodes)
        .force("y", d3.forceY(boxHeight / 2))
        .force("collide", d3.forceCollide(nodePadding))
        .force("charge", d3.forceManyBody()
            .strength(-100))
        .force("link", d3.forceLink().id(d => {
            return d.id
        }));

    let n = 100;

    simulation.restart();
    simulation.force("link")
        .links(graph.links);
    for (let i = n * n; i > 0; --i) simulation.tick();
    simulation.stop();

    const link = network.selectAll("links")
        .data(graph.links)
        .enter()
        .append("line")
        .attr("id", (d) => {
            return (`link${d.source.id}${d.target.id}${d.doc_id}`)
        })
        .style("opacity", 0.5)
        .style("stroke", (d) => {
            return ("hsl(" + d.hue + ", 80%, 50%)");
        });

    const node = network.selectAll("circle")
        .data(graph.nodes)
        .enter()
        .append("circle")
        .attr("id", (d) => {
            return (`node${d.id}`)
        })
        .style("opacity", 1)
        .style("fill", (d) => {
            return ("hsl(" + d.hue + ", 80%, 50%)")
        })
        .attr("r", (d) => {
            let nodeRadius = nodeScale(d.degree);
            d.nodeRadius = nodeRadius;
            return (nodeRadius);
        });

    const cloud = network.selectAll("image")
        .data(graph.nodes)
        .enter()
        .append("image")
        .attr('id', (d) => {
            return ("nodeCloud" + d.id)
        })
        .attr("xlink:href", (d) => {
            if (d.cloud) {
                let fileName = "node_" + d.id + "_" + modelName;
                return (cloudPath + fileName + ".svg");
            }
            return blankPNG;
        })
        .style('opacity', 1)

    node
        .attr("cx", (d) => {
            return d.x
        })
        .attr("cy", (d) => {
            return d.y
        });
    link
        .attr("x1", (d) => {
            return d.source.x
        })
        .attr("y1", (d) => {
            return d.source.y
        })
        .attr("x2", (d) => {
            return d.target.x
        })
        .attr("y2", (d) => {
            return d.target.y
        });

    cloud
        .attr("x", (d) => {
            return (d.x - d.nodeRadius)
        })
        .attr("y", (d) => {
            return (d.y - d.nodeRadius)
        })
        .attr('width', (d) => {
            return (d.nodeRadius * 2)
        })
        .attr('height', (d) => {
            return (d.nodeRadius * 2)
        })


    if (!fs.existsSync(graphDir)) {
        fs.mkdirSync(graphDir);
    }

    const svgFile = graphDir + modelName + '.svg';
    fs.writeFile(svgFile, d3n.svgString(), err => {
        if (err) {
            console.log(err)
        }
    })
}

const getModels = () => {
    const jsonPath = "./public/json/"
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
    models.forEach(modelName => { generateGraph(modelName); });
} else {
    console.log("No models found.");
}
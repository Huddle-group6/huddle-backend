const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const docsDir = path.join(__dirname, "../docs");
const base = yaml.load(
	fs.readFileSync(path.join(docsDir, "base.yaml"), "utf8"),
);

// Each route group keeps its own yaml file; `paths` from all of them are
// merged onto the shared `base` spec (info/components/security schemes).
const routeSpecs = ["auth.yaml", "workspaces.yaml", "channels.yaml"].map((file) =>
	yaml.load(fs.readFileSync(path.join(docsDir, file), "utf8")),
);

const swaggerSpec = {
	...base,
	paths: Object.assign({}, ...routeSpecs.map((spec) => spec.paths)),
};

module.exports = swaggerSpec;

require("make-promises-safe");
require("dotenv").config();

// Require Third-party Dependencies
const repos = require("repos");
const git = require("isomorphic-git");
const is = require("@slimio/is");

// Require Node.js Dependencies
const fs = require("fs");
const { readFile } = fs.promises;
const { join } = require("path");
const { promisify } = require("util");
const cp = require("child_process");
git.plugins.set("fs", fs);

// Require Internal Dependencies
const { traverseProjectJSON } = require("./src/utils");

// CONSTANT
const GITHUB_ORGA = process.env.GITHUB_ORGA;
const ORGA_URL = `https://github.com/${process.env.GITHUB_ORGA}`;

// Global
const token = "d26a4136a6c0f1e007540a66838e52e9f56af8a2";
const mapper = new Map();
const exec = promisify(cp.exec);

async function cloneRep(repName) {
    const dir = join(__dirname, "clones", repName);
    const url = `${ORGA_URL}/${repName}`;

    console.log(`Cloning: ${url}`);
    await git.clone({
        dir, url, token,
        singleBranch: true,
        noCheckout: true,
        oauth2format: "github"
    });

    const prefix = mapper.has(repName) ? mapper.get(repName) : repName;
    await exec(`gource --output-custom-log logs/${repName}.txt clones/${repName}`);
    await exec(`sed -i -r "s#(.+)\\|#\\1|/${prefix}#" logs/${repName}.txt`);
}

async function getAllRepo() {
    const allRepositories = await repos(process.env.GITHUB_ORGA, { token });
    const rejects = [];

    await Promise.all(
        allRepositories.map((repo) => cloneRep(repo.name).catch(rejects.push))
    );
    rejects.forEach((err) => console.error(err));

    await exec("cat logs/*.txt | sort > logs/combined/fullLog.txt");
    cp.spawn("gource.cmd", ["logs/combined/fullLog.txt", "-s", "0.2"]);
}

async function main() {
    try {
        const buffer = await readFile(`./repoMapping/${GITHUB_ORGA}.json`);
        const mappingJSON = JSON.parse(buffer.toString());

        for (const [depName, str] of traverseProjectJSON(mappingJSON)) {
            mapper.set(depName, str);
        }
    }
    catch (err) {
        console.error(err);
    }

    await getAllRepo();
}
main().catch(console.error);

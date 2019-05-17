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
const { exec, spawn } = require("child_process");
git.plugins.set("fs", fs);

// CONSTANT
const GITHUB_URL = "https://github.com";
const GITHUB_ORGA = process.env.GITHUB_ORGA;
const DIR_FILES = join(__dirname, "/logs");
// Global
const token = process.env.GITHUB_TOKEN;
const orgaUrl = `${GITHUB_URL}/${process.env.GITHUB_ORGA}`;

const mapper = new Map();
function getRepoCommitsLogs(repName) {
    return new Promise((resolve) => {
        exec(`gource --output-custom-log logs/${repName}.txt clones/${repName}`, () => {
            const prefix = mapper.has(repName) ? mapper.get(repName) : repName;
            if (mapper.has(repName) === false) {
                console.log(`REPNAME: ${repName}`);
            }
            exec(`sed -i -r "s#(.+)\\|#\\1|/${prefix}#" logs/${repName}.txt`, resolve);
        });
    });
}

async function cloneRep(repName) {
    const dir = join(__dirname, "clones", repName);
    const url = `${orgaUrl}/${repName}`;
    console.log(url);
    try {
        // console.log(`${repName} start`);
        await git.clone({
            dir,
            url,
            singleBranch: true,
            noCheckout: true,
            oauth2format: "github",
            token
        });
        console.log(`${repName} cloned`);
        await getRepoCommitsLogs(repName);
    }
    catch (err) {
        console.log(`${url} failed`);
        throw err;
    }
}

async function getAllRepo() {
    const allRepositories = await repos(process.env.GITHUB_ORGA, { token });
    const allRepoName = allRepositories.map((obj) => obj.name);
    // console.log(allRepoName);

    const rejects = [];
    console.log("Run all");
    const result = await Promise.all(allRepoName.map((repName) => cloneRep(repName).catch(rejects.push)));
    for (const reject of rejects) {
        console.log(reject);
        console.log();
    }

    exec("cat logs/*.txt | sort > logs/combined/fullLog.txt", () => {
        spawn("gource.cmd", ["logs/combined/fullLog.txt", "-s", "0.75"]);
    });
}

function* recursive(elem, str = "") {
    const prefix = str === "" ? "" : `${str}/`;
    if (is.plainObject(elem)) {
        for (const [key, value] of Object.entries(elem)) {
            yield* recursive(value, `${prefix}${key === "default" ? "" : key}`);
        }
    }
    else if (is.array(elem)) {
        for (const depName of elem) {
            yield [depName, `${prefix}${depName}`];
        }
    }
}

async function mapping() {
    try {
        const path = `./repoMapping/${GITHUB_ORGA}.json`;
        const buffer = await readFile(path);
        const mappingJSON = JSON.parse(buffer.toString());

        for (const [depName, str] of recursive(mappingJSON)) {
            mapper.set(depName, str);
        }
        console.log(mapper);
    }
    catch (err) {
        console.error(err);
    }
}

async function main() {
    await mapping();
    await getAllRepo();
}
main().catch(console.error);


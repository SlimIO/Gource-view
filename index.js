"use strict";

require("make-promises-safe");
require("dotenv").config();

// Require Third-party Dependencies
const { fetch } = require("fetch-github-repositories");
const git = require("isomorphic-git");

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
const EXCLUDED = new Set(["blog"]);

// Global
const token = process.env.GITHUB_TOKEN;
const mapper = new Map();
const exec = promisify(cp.exec);

/**
 * @async
 * @function cloneRep
 * @param {!string} repName
 * @returns {Promise<void>}
 */
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
    await exec(`gource --output-custom-log history/${repName}.txt clones/${repName}`);
    await exec(`sed -i -r "s#(.+)\\|#\\1|/${prefix}#" history/${repName}.txt`);
}

/**
 * @async
 * @function getAllRepo
 * @returns {Promise<void>}
 */
async function getAllRepo() {
    const allRepositories = await fetch(process.env.GITHUB_ORGA, { token, kind: "orgs" });
    const rejects = [];

    await Promise.all(
        allRepositories
            .filter((repo) => !EXCLUDED.has(repo.name.toLowerCase()))
            .filter((repo) => repo.fork === false)
            .map((repo) => cloneRep(repo.name).catch((err) => rejects.push(err)))
    );
    rejects.forEach((err) => console.error(err));

    await exec("cat history/*.txt | sort > history/combined/fullLog.txt");
    cp.spawn("gource.cmd", ["history/combined/fullLog.txt", "-s", "0.2"]);
}

/**
 * @async
 * @function main
 * @returns {Promise<void>}
 */
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

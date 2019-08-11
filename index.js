"use strict";

require("make-promises-safe");
require("dotenv").config();

// Require Third-party Dependencies
const { fetch } = require("fetch-github-repositories");
const git = require("isomorphic-git");

// Require Node.js Dependencies
const fs = require("fs");
const { readFile, readdir, unlink, mkdir } = fs.promises;
const { join, extname } = require("path");
const { promisify } = require("util");
const cp = require("child_process");
const premove = require("premove");

// Require Internal Dependencies
const { traverseProjectJSON } = require("./src/utils");

// CONSTANT
const GITHUB_ORGA = process.env.GITHUB_ORGA;
const ORGA_URL = `https://github.com/${process.env.GITHUB_ORGA}`;
const EXCLUDED = new Set(["blog"]);
const HISTORY_DIR = join(__dirname, "history");

// Global
const token = process.env.GITHUB_TOKEN;
const mapper = new Map();
git.plugins.set("fs", fs);
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
    console.log(` > Retrieved ${allRepositories.length} repositories from ORG: ${process.env.GITHUB_ORGA}\n`);
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
        const buffer = await readFile(join(__dirname, "src", "config", `${GITHUB_ORGA}.json`));
        const mappingJSON = JSON.parse(buffer.toString());

        for (const [depName, str] of traverseProjectJSON(mappingJSON)) {
            mapper.set(depName, str);
        }
    }
    catch (err) {
        console.error(err);
    }

    // Create history/combined
    await mkdir(join(HISTORY_DIR, "combined"), { recursive: true });

    // Cleanup history dir
    try {
        const files = await readdir(HISTORY_DIR);
        await Promise.all(
            files.filter((file) => extname(file) === ".txt").map((file) => unlink(join(HISTORY_DIR, file)))
        );
    }
    catch (err) {
        // Ignore
    }

    // Process Repositories
    try {
        await getAllRepo();
    }
    finally {
        await premove(join(__dirname, "clones"));
    }
}
main().catch(console.error);

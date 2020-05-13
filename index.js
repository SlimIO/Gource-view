"use strict";

require("make-promises-safe");
require("dotenv").config();

// Require Node.js Dependencies
const fs = require("fs");
const { readFile, readdir, unlink, mkdir, rmdir } = fs.promises;
const { join, extname } = require("path");
const { promisify } = require("util");
const cp = require("child_process");

// Require Third-party Dependencies
const { fetch } = require("fetch-github-repositories");
const http = require("isomorphic-git/http/node");
const git = require("isomorphic-git");

// Require Internal Dependencies
const { traverseProjectJSON } = require("./src/utils");

// CONSTANT
const GITHUB_ORGA = typeof process.env.GITHUB_ORGA === "string" ? process.env.GITHUB_ORGA : "SlimIO";
const GITHUB_KIND = typeof process.env.GITHUB_KIND === "string" ? process.env.GITHUB_KIND : "orgs";
const EXCLUDED = new Set(["blog"]);
const HISTORY_DIR = join(__dirname, "history");

// Global
const token = process.env.GIT_TOKEN;
const mapper = new Map();
const exec = promisify(cp.exec);

/**
 * @async
 * @function cloneRep
 * @description clone a given repository from github
 * @param {!string} orgaName
 * @param {!string} repName
 * @returns {Promise<void>}
 */
async function cloneRep(orgaName, repName) {
    const dir = join(__dirname, "clones", repName);
    const url = `https://github.com/${orgaName}/${repName}`;

    console.log(`Cloning: ${url}`);
    await git.clone({
        fs, http, dir, url,
        onAuth() {
            return { username: process.env.GIT_TOKEN, password: "x-oauth-basic" };
        },
        singleBranch: true,
        noCheckout: true,
        corsProxy: "https://cors.isomorphic-git.org"
    });

    const prefix = mapper.has(repName) ? mapper.get(repName) : repName;
    await exec(`gource --output-custom-log history/${repName}.txt clones/${repName}`);
    await exec(`sed -i -r "s#(.+)\\|#\\1|/${prefix}#" history/${repName}.txt`);
}

/**
 * @function cloneError
 * @param {!any} error error
 * @returns {void}
 */
function cloneError(error) {
    console.error(error);
}

/**
 * @async
 * @function getAllRepo
 * @description retrieve all github repositories of the given organization (configured in env)
 * @param {!string} orgaName
 * @param {string} [kind="orgs"]
 * @returns {Promise<void>}
 */
async function getAllRepo(orgaName, kind = "orgs") {
    const allRepositories = await fetch(orgaName, { token, kind });
    console.log(` > Retrieved ${allRepositories.length} repositories from ${kind}: ${GITHUB_ORGA}\n`);

    const cloneResults = await Promise.allSettled(
        allRepositories
            .filter((repo) => !EXCLUDED.has(repo.name.toLowerCase()))
            .filter((repo) => repo.fork === false)
            .map((repo) => cloneRep(orgaName, repo.name))
    );

    cloneResults.filter((result) => result.status === "rejected").forEach(cloneError);
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
        console.log("Failed to load categories configuration!");
        // Ignore
    }

    // Create history/combined
    await mkdir(join(HISTORY_DIR, "combined"), { recursive: true });

    // Cleanup history dir
    try {
        const files = await readdir(HISTORY_DIR);
        await Promise.allSettled(
            files.filter((file) => extname(file) === ".txt").map((file) => unlink(join(HISTORY_DIR, file)))
        );
    }
    catch (err) {
        // Ignore
    }

    // Process Repositories
    try {
        await getAllRepo(GITHUB_ORGA, GITHUB_KIND);

        await exec("cat history/*.txt | sort > history/combined/fullLog.txt");
        const child = cp.spawn("gource.cmd", ["history/combined/fullLog.txt", "-s", "0.2"]);
        await new Promise((resolve, reject) => {
            child.once("close", resolve);
            child.once("error", reject);
        });
    }
    finally {
        await Promise.all([
            rmdir(join(__dirname, "history"), { recursive: true }),
            rmdir(join(__dirname, "clones"), { recursive: true })
        ]);
    }
}
main().catch(console.error);

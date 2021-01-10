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
const ms = require("ms");
const kleur = require("kleur");
const Locker = require("@slimio/lock");
const Spinner = require("@slimio/async-cli-spinner");

// Require Internal Dependencies
const { traverseProjectJSON } = require("./src/utils");

// CONSTANT
const GITHUB_ORGA = typeof process.env.GITHUB_ORGA === "string" ? process.env.GITHUB_ORGA : "SlimIO";
const GITHUB_KIND = typeof process.env.GITHUB_KIND === "string" ? process.env.GITHUB_KIND : "orgs";
const EXCLUDED = new Set(["blog"]);
const HISTORY_DIR = join(__dirname, "history");
const kCloneLocker = new Locker({ maxConcurrent: 10 });

// Global
// Spinner.DEFAULT_SPINNER = "dots";
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
    const free = await kCloneLocker.acquireOne();
    const spin = new Spinner({
        prefixText: kleur.cyan().bold(`${repName}`)
    }).start();

    try {
        const dir = join(__dirname, "clones", repName);
        const url = `https://github.com/${orgaName}/${repName}`;

        spin.text = kleur.white().bold(`Cloning git repo ${kleur.yellow().bold(url)}`);
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

        spin.text = kleur.white().bold("Execute gource command");
        await exec(`gource --output-custom-log history/${repName}.txt clones/${repName}`);

        spin.text = kleur.white().bold("Execute sed command");
        await exec(`sed -i -r "s#(.+)\\|#\\1|/${prefix}#" history/${repName}.txt`);

        const executionTime = kleur.cyan().bold(ms(Number(spin.elapsedTime.toFixed(2))));
        spin.succeed(kleur.green().bold(`Successfully managed in ${executionTime}`));
    }
    catch (err) {
        spin.failed(kleur.bold().red(err.message));

        throw err;
    }
    finally {
        free();
    }
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

    console.log(" > Show clone errors: ");
    cloneResults
        .filter((result) => result.status === "rejected")
        .forEach((error) => console.log(error?.message));
}

/**
 * @async
 * @function main
 * @returns {Promise<void>}
 */
async function main() {
    console.log(" > Loading configuration.");
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
    console.log(" > Creating history and combined directory!");
    await mkdir(join(HISTORY_DIR, "combined"), { recursive: true });

    // Cleanup history dir
    console.log(" > Cleaning /history dir from previous run");
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

        console.log(" > Processing combined history before executing gource!");
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

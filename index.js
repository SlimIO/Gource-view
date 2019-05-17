// Require Node.js Dependencies
const fs = require("fs");
const { join } = require("path");
const { exec, spawn } = require("child_process");

// Require Third-party Dependencies
require("make-promises-safe");
require("dotenv").config();
const repos = require("repos");
const git = require("isomorphic-git");

git.plugins.set("fs", fs);
// CONSTANT
const GITHUB_URL = "https://github.com";
const DIR_FILES = join(__dirname, "/logs");
// Global
const token = process.env.GITHUB_TOKEN;
const orgaUrl = `${GITHUB_URL}/${process.env.GITHUB_ORGA}`;


async function getRepoCommitsLogs(repName) {
    exec(`gource --output-custom-log logs/${repName}.txt clones/${repName}`, async() => {
        await exec(`sed -i -r "s#(.+)\\|#\\1|/${repName}#" logs/${repName}.txt`);
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

    await exec("cat logs/*.txt | sort > logs/combined/fullLog.txt", () => {
        spawn("gource.cmd", ["logs/combined/fullLog.txt", "-s", "0.2"]);
    });
}

async function main() {
    await getAllRepo();
}
main().catch(console.error);


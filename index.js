// Require Node.js Dependencies
const { appendFile } = require("fs").promises;
const fs = require("fs");
const { join } = require("path");
const { spawn } = require("child_process");

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
// const reposUrl = `${GITHUB_URL}/repos/${process.env.GITHUB_ORGA}`;
const headers = {
    "User-Agent": "SlimIO",
    Authorization: `token ${process.env.GITHUB_TOKEN}`,
    "Retry-After": 5
};

async function writeCommits(url, repName, sha) {
    const { data } = await get(`${url}/${sha}`, { headers });
    // console.log(data);
    const { commit: { author: { name, date } }, files } = data;
    let commitToWrite = "";
    for (const { filename, status } of files) {
        const timestamp = Date.parse(date);
        let statusLetter;
        switch (status) {
            case "modified": statusLetter = "M"; break;
            case "removed": statusLetter = "D"; break;
            case "added": statusLetter = "A"; break;
            case "renamed": statusLetter = "R"; break;
            default: throw Error(`Status ${status} for file ${filename} is not repertoried`);
        }
        commitToWrite += `${timestamp}|${name}|${statusLetter}|${filename}\n`;
    }
    await appendFile(join(DIR_FILES, `./${repName}.txt`), commitToWrite);
}

async function getRepoCommits(repName) {
    // console.log(`Repository name: ${repName}`);
    const commitsUrl = `${reposUrl}/${repName}/commits`;
    try {
        const { data: commits } = await get(commitsUrl, { headers });
        // console.log(`${commitsUrl} validate`);
        const commitsSha = commits.map((commit) => commit.sha);

        // Retrieve info of commit with sha
        for (const sha of commitsSha) {
            await writeCommits(commitsUrl, repName, sha);
        }
        console.log(`writeCommits for ${commitsUrl} all writed !`);
    }
    catch (err) {
        console.log(`${commitsUrl} failed !`);
        console.error(err);
        console.error(err.stack);
        throw err;
    }
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
    // try {
    const result = await Promise.all(allRepoName.map((repName) => cloneRep(repName).catch(rejects.push)));
    // }
    // catch (err) {
    //     for (const reject of rejects) {
    //         console.log(reject);
    //         console.log();
    //     }
    // }
    // let cmd = "cat ";
    // const array = [];
    // for (const repName of allRepoName) {
    //     array.push(`${repName}.txt`);
    //     cmd += `${repName}.txt `;
    // }
    // array.push("> combined.txt");
    // cmd += "> combined.txt";
    // await spawn("cat", [...array], { cwd: DIR_FILES });
}

async function main() {
    getAllRepo();
}
main().catch(console.error);


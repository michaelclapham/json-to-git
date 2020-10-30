import express from "express";
import yargs from "yargs";
import * as bodyParser from "body-parser";
import { GitRepo } from "./git-repo";
import * as path from "path";

require('dotenv').config();

const argv = yargs(process.argv.slice(2)).options({
    port: { type: 'number', default: process.env.PORT ? process.env.PORT : 9002 },
    prefix: { type: 'string', default: process.env.PREFIX ? process.env.PREFIX : "/json-to-git" },
    cloneUrl: { type: 'string', default: process.env.REPO_CLONE_URL }
}).argv;

const app = express();

app.use(bodyParser.json());

let router = express.Router();
const gitRepo = new GitRepo(path.join(__dirname, "../repo"), argv.cloneUrl);
gitRepo.init();

router.post("/commit/:branch/*", async (req, res) => {
    let filePathAfterBranch = req.path.slice(req.path.indexOf(req.params.branch) + req.params.branch.length);
    let commitMsg = "Content update. " + (req.query.commitMsg ? req.query.commitMsg : "");
    try {
        let output = gitRepo.writeAndCommit(req.params.branch, filePathAfterBranch, JSON.stringify(req.body, null, 4), commitMsg);
        output += gitRepo.push(req.params.branch);
        res.send(output);
    } catch (ex) {
        res.write("Error " + ex);
        res.status(500);
        res.end();
    }
});


app.use(argv.prefix, router);

console.log("Starting server on port ", argv.port);
app.listen(argv.port);
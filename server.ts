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
    let outputString = `LOOK MAH I STRIGYIFIED IT. Branch: ${req.params.branch}` + JSON.stringify(req.body);
    let filePathAfterBranch = req.path.slice(req.path.indexOf(req.params.branch) + req.params.branch.length);
    outputString += "\n" + filePathAfterBranch;
    let commitMsg = "Content update. " + (req.query.commitMsg ? req.query.commitMsg : "");
    try {
        gitRepo.gitCheckoutRemote(req.params.branch);
        let output = gitRepo.writeAndCommit(filePathAfterBranch, JSON.stringify(req.body), commitMsg);
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
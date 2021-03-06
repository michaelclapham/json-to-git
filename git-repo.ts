import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

export const REPO_NAME_FROM_URL_REGEX = /(?<repoName>[a-zA-Z0-9_-]*)\.git$/;

export class GitRepo {

    private repoName: string;
    private repoPath: string;

    constructor(private baseDir: string, private cloneUrl: string) {
        this.repoName = REPO_NAME_FROM_URL_REGEX.exec(this.cloneUrl).groups.repoName;
        this.repoPath = path.join(this.baseDir, this.repoName);
    }

    public init() {
        if (!fs.existsSync(this.baseDir)) {
            fs.mkdirSync(this.baseDir);
        }
        if (!fs.existsSync(this.repoPath)) {
            this.clone();
        }
    }

    private runGit(params: string[]) {
        process.chdir(this.repoPath);
        console.log("Changed directory to ", this.repoPath);
        console.log("Running git command: git " + params.join(" ").replace("&", ""));
        try {
            let buffer = execSync('git ' + params.join(" ").replace("&", ""));
            const outputString = buffer.toString();
            return outputString;
        } catch (ex) {
            return "" + ex;
        }
        process.chdir(__dirname);
        console.log("Changed directory to ", __dirname);

    }

    public clone() {
        console.log("Cloning repo ", this.cloneUrl);
        this.runGit(['clone', this.cloneUrl, this.repoPath]);
    }

    public add(filename: string) {
        return this.runGit(["add", filename]);
    }

    public commit(msg: string) {
        return this.runGit(["commit", "-m", '"' + msg.replace("\"", " ") + '"']);
    }

    public log() {
        return this.runGit(["log"]);
    }

    public push(remoteBranch: string) {
        return this.runGit(["push", "--set-upstream", "origin", remoteBranch]);
    }

    public fetch() {
        return this.runGit(["fetch"]);
    }

    public branchExistsLocally(branchName: string): boolean {
        return !this.runGit([""]).startsWith("fatal");
    }

    public checkout(branchName: string) {
        let safeBranchName = branchName.replace(" ", "").replace("&","").replace(";","");
        return this.runGit(["checkout", this.branchExistsLocally(branchName) ? "" : "-b", safeBranchName]);
    }

    public writeAndCommit(branchName: string, filepath: string, data: string, commitMsg: string) {
        let outputPath = path.join(this.repoPath, filepath);
        let output = "";
        console.log("Writing to path ", outputPath);
        fs.writeFileSync(outputPath, data);
        output += this.fetch();
        output += this.checkout(branchName);
        output += this.add(".");
        output += this.commit(commitMsg); 
        return output;
    }

}
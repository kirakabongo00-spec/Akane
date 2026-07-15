const fs = require("fs");
const path = require("path");
const { spawn, execSync } = require("child_process");

const USER_NUMBER = "221705928204";
const GITHUB_REPO = "https://github.com/akanefx2003/AKANE_MD.git";

const c = {
    reset:  "\x1b[0m",
    pink:   "\x1b[35m",
    green:  "\x1b[32m",
    red:    "\x1b[31m",
    cyan:   "\x1b[36m",
    yellow: "\x1b[33m",
    bold:   "\x1b[1m",
}

const ok  = (m) => console.log(`${c.green}  ✔  ${m}${c.reset}`)
const err = (m) => console.log(`${c.red}  ✘  ${m}${c.reset}`)
const inf = (m) => console.log(`${c.cyan}  ◈  ${m}${c.reset}`)

function banner() {
    console.clear()
    console.log(`${c.pink}${c.bold}`)
    console.log(`  ┌────────────────────────────────────┐`)
    console.log(`  │       🌸  AKANE MD DÉPLOIEMENT  🌸   │`)
    console.log(`  └────────────────────────────────────┘`)
    console.log(`${c.reset}`)
}

async function progress(label, fn) {
    const frames = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏']
    let i = 0
    process.stdout.write(`\r${c.yellow}  ${frames[0]}  ${label}...${c.reset}`)
    const timer = setInterval(() => {
        process.stdout.write(`\r${c.yellow}  ${frames[i++ % frames.length]}  ${label}...${c.reset}`)
    }, 80)
    try {
        const result = await fn()
        clearInterval(timer)
        process.stdout.write(`\r${c.green}  ✔  ${label}${c.reset}\n`)
        return result
    } catch(e) {
        clearInterval(timer)
        process.stdout.write(`\r${c.red}  ✘  ${label}${c.reset}\n`)
        throw e
    }
}

function clean() {
    fs.readdirSync(__dirname).forEach(file => {
        if (file === "deploy.js") return
        try {
            const p = path.join(__dirname, file)
            fs.statSync(p).isDirectory()
                ? fs.rmSync(p, { recursive: true, force: true })
                : fs.unlinkSync(p)
        } catch(e) {}
    })
}

function setup() {
    ["sessions", "data", "temp", "database"].forEach(d => {
        fs.mkdirSync(path.join(__dirname, d), { recursive: true })
    })
    const cfg = path.join(__dirname, "data", "config.json")
    if (!fs.existsSync(cfg)) {
        fs.writeFileSync(cfg, JSON.stringify({
            prefix: ".",
            botName: "AKANE MD",
            owner: USER_NUMBER,
            reaction: "🌸",
            channelLink: "https://whatsapp.com/channel/0029VbBzhyQ4NVisPH1NSe1R"
        }, null, 2))
    }
    const ax = path.join(__dirname, "AKANEX", "akanex.js")
    if (fs.existsSync(ax)) {
        fs.writeFileSync(ax,
            fs.readFileSync(ax, "utf8")
              .replace(/phoneNumber:\s*['"]\d+['"]/, `phoneNumber: '${USER_NUMBER}'`)
        )
    }
}

function installDeps() {
    return new Promise((resolve, reject) => {
        const p = spawn("npm", ["install"], { stdio: "pipe", shell: true })
        p.on("close", code => code === 0 ? resolve() : reject(new Error("npm install failed")))
    })
}

async function startBot() {
    inf("Démarrage d'AKANE MD...")
    try {
        const { default: connect } = await import("./AKANEX/akanex.js")
        const { default: handler } = await import("./akane/akanes.js")
        await connect(handler)
    } catch(e) {
        err(`Erreur: ${e.message}`)
        setTimeout(startBot, 5000)
    }
}

async function main() {
    banner()
    inf(`Numéro : ${USER_NUMBER}\n`)
    try {
        await progress("Nettoyage", async () => clean())
        await progress("Clonage GitHub", async () => execSync(`git clone ${GITHUB_REPO} .`, { stdio: "pipe" }))
        await progress("Configuration", async () => setup())
        await progress("Installation des dépendances", () => installDeps())
        console.log(`\n${c.pink}${c.bold}  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}`)
        ok("Déploiement terminé — lancement du bot...\n")
        await startBot()
    } catch(e) {
        err(`Déploiement échoué : ${e.message}`)
        process.exit(1)
    }
}

main()

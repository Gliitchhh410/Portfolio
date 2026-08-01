"use client";

import type { CSSProperties, FormEvent, KeyboardEvent, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

type WindowName = "about" | "terminal" | "tasks" | "monitor";
type Position = { x: number; y: number };
type WindowSize = { width: number; height: number };
type LinkItem = { label: string; href: string; download?: boolean };
type Block = { id: number; kind: "command" | "response" | "error" | "system"; title?: string; lines: string[]; links?: LinkItem[] };
type Project = { slug: string; title: string; status: string; summary: string; stack: string[]; highlights: string[]; links?: LinkItem[] };

const PROJECTS: Project[] = [
  {
    slug: "goa",
    title: "Global Opportunity Assistant",
    status: "IN_PROGRESS",
    summary: "A nine-service multi-agent AI platform for graduate-program discovery, profile matching, RAG, writing, and speaking evaluation.",
    stack: ["Go/Fiber", "NestJS", "FastAPI", "PostgreSQL", "pgvector", "Redis", "AWS SQS"],
    highlights: [
      "Led a five-engineer team and defined service boundaries, data ownership, and versioned cross-language contracts.",
      "Built multi-agent orchestration with schema validation, bounded retries, and Redis-backed token and cost controls.",
      "Engineered a concurrent four-agent IELTS scoring swarm with deterministic band aggregation.",
    ],
  },
  {
    slug: "chill-db",
    title: "Chill-DB v2",
    status: "PUBLIC_REPOSITORY",
    summary: "An LSM-tree storage engine written from first principles in Go with WAL-backed crash durability.",
    stack: ["Go", "LSM Trees", "WAL", "SSTables", "Bloom Filters", "ACID"],
    highlights: [
      "Sustains 0.6ms inserts with binary WAL encoding and fsync.",
      "Reduced hit latency 80% and miss latency 94% through binary search and Bloom filtering.",
      "Accelerated compaction 66% using parallel SSTable merging and low-allocation writes.",
    ],
    links: [{ label: "SOURCE_CODE", href: "https://github.com/Gliitchhh410/chill-db" }],
  },
  {
    slug: "chill-http",
    title: "HTTP/1.1 Server From Scratch",
    status: "PUBLIC_REPOSITORY",
    summary: "A performance-oriented HTTP/1.1 server implemented directly over TCP in Go.",
    stack: ["Go", "TCP", "HTTP/1.1", "Worker Pool", "Fuzzing"],
    highlights: [
      "Zero-allocation parser benchmarked at 410ns/op across body sizes and header counts.",
      "Bounded worker pool and instant 503 load shedding keep the accept loop responsive.",
      "Slowloris defense passed more than 2.8M fuzz mutations with zero panics.",
    ],
    links: [{ label: "SOURCE_CODE", href: "https://github.com/Gliitchhh410/chill-http" }],
  },
  {
    slug: "pos",
    title: "Multi-Tenant Point of Sale",
    status: "DEPLOYMENT_READY",
    summary: "A transaction-safe POS platform with automated multi-AZ AWS infrastructure.",
    stack: ["Laravel", "Vue.js", "Redis", "Docker", "AWS", "Terraform"],
    highlights: [
      "Provisioned two availability zones and four subnets behind an Application Load Balancer.",
      "Implemented three rate-limit tiers, transaction idempotency, and four priority queue networks.",
      "Authored 117 automated tests with 722 assertions across 20 suites.",
    ],
    links: [{ label: "SOURCE_CODE", href: "https://github.com/ITI-OpenSource-Alex/POS" }],
  },
];

const COMPLETIONS = ["help", "about", "skills", "experience", "projects", "project goa", "project chill-db", "project chill-http", "project pos", "education", "certifications", "contact", "resume", "github", "status", "clear"];
const DEFAULT_POSITIONS: Record<WindowName, Position> = {
  about: { x: 34, y: 112 },
  terminal: { x: 390, y: 74 },
  tasks: { x: 720, y: 32 },
  monitor: { x: 735, y: 350 },
};
const DEFAULT_SIZES: Record<WindowName, WindowSize> = {
  about: { width: 360, height: 430 },
  terminal: { width: 620, height: 500 },
  tasks: { width: 520, height: 330 },
  monitor: { width: 520, height: 300 },
};
const MIN_SIZES: Record<WindowName, WindowSize> = {
  about: { width: 290, height: 330 },
  terminal: { width: 430, height: 320 },
  tasks: { width: 380, height: 260 },
  monitor: { width: 390, height: 270 },
};

function makeResponse(raw: string, id: number): Block {
  const command = raw.trim().toLowerCase().replace(/\s+/g, " ");
  const response = (title: string, lines: string[], links?: LinkItem[]): Block => ({ id, kind: "response", title, lines, links });
  if (command === "help") return response("AVAILABLE_COMMANDS", [
    "PORTFOLIO  about · skills · experience · projects · project <slug> · education · certifications · contact · resume · github · status",
    "FILES      ls [-la] · tree · pwd · cd · cat · head · tail · less · find · grep",
    "SYSTEM     whoami · id · hostname · uname -a · neofetch · uptime · date · env · free -h · df -h · ps aux · top · htop",
    "DEV        git status · git log · git remote -v · which · curl · ssh",
    "SHELL      history · echo · man · clear · reset · exit",
    "The portfolio filesystem is read-only; write and destructive commands are safely blocked.",
  ]);
  if (command === "ls" || command.startsWith("ls ")) return response(command.includes("-l") ? "DIRECTORY_LISTING // LONG_FORMAT" : "DIRECTORY_LISTING", [
    command.includes("-l") ? "dr-xr-xr-x  projects/        4 operation records" : "projects/",
    command.includes("-l") ? "-r--r--r--  about.txt       identity record" : "about.txt",
    command.includes("-l") ? "-r--r--r--  skills.sys      technical inventory" : "skills.sys",
    command.includes("-l") ? "-r--r--r--  experience.log  career record" : "experience.log",
    command.includes("-l") ? "-r--r--r--  education.rec   academic record" : "education.rec",
    command.includes("-l") ? "-r--r--r--  certs.key       verified credentials" : "certs.key",
    command.includes("-l") ? "-r--r--r--  contact.link    secure channels" : "contact.link",
    command.includes("-l") ? "-r--r--r--  resume.pdf      complete CV" : "resume.pdf",
  ]);
  if (command === "pwd") return response("WORKING_DIRECTORY", ["/home/ahmed/portfolio"]);
  if (command === "tree" || command.startsWith("tree ")) return response("PORTFOLIO_FILESYSTEM", [
    ".", "├── about.txt", "├── skills.sys", "├── experience.log", "├── education.rec", "├── certs.key", "├── contact.link", "├── resume.pdf", "└── projects", "    ├── goa.md", "    ├── chill-db.md", "    ├── chill-http.md", "    └── pos.md", "", "1 directory, 11 files",
  ]);
  if (command.startsWith("cat ") || command.startsWith("less ") || command.startsWith("more ") || command.startsWith("head ") || command.startsWith("tail ")) {
    const file = command.slice(command.indexOf(" ") + 1).replace(/^(-n \d+|-f) /, "").replace(/^\.\//, "");
    if (file.includes("about")) return makeResponse("about", id);
    if (file.includes("skill")) return makeResponse("skills", id);
    if (file.includes("experience") || file.includes("career")) return makeResponse("experience", id);
    if (file.includes("education")) return makeResponse("education", id);
    if (file.includes("cert")) return makeResponse("certifications", id);
    if (file.includes("contact")) return makeResponse("contact", id);
    if (file.includes("resume") || file.includes("cv")) return makeResponse("resume", id);
    const project = PROJECTS.find((item) => file.includes(item.slug));
    if (project) return makeResponse(`project ${project.slug}`, id);
    return { id, kind: "error", title: "NO_SUCH_FILE", lines: [`cat: ${file}: No such portfolio record`, "Run `ls` or `tree` to inspect available files."] };
  }
  if (command === "whoami") return response("IDENTITY", ["ahmed", "Ahmed Mounir Ali · Backend Engineer"]);
  if (command === "id") return response("USER_ID", ["uid=0410(ahmed) gid=1000(backend) groups=distributed-systems,cloud,storage,applied-ai"]);
  if (command === "hostname" || command === "hostnamectl") return response("HOST", ["ahmed-portfolio", "Virtualization: Cloudflare Edge · Kernel: AHMED-OS"]);
  if (command === "uname" || command.startsWith("uname ")) return response("KERNEL_INFO", ["AHMED-OS portfolio 2.0.0-edge #0410 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux"]);
  if (["neofetch", "fastfetch"].includes(command)) return response("AHMED@PORTFOLIO", [
    "OS: AHMED-OS v2.0", "Host: Alexandria, Egypt", "Kernel: Backend Engineering", "Shell: portfolio-zsh", "CPU: Go · TypeScript · Python", "Memory: PostgreSQL · Redis · pgvector", "Cloud: AWS · Docker · Terraform", "Status: Open to relocation & remote",
  ]);
  if (command === "ps" || command.startsWith("ps ") || command === "top" || command === "htop") return response("RUNNING_PROCESSES", [
    "PID   COMMAND       LOAD      STATUS", "001   saspod-api    ACTIVE    Running", "002   chill-db      0.6ms     Stable", "003   chill-http    410ns     Running", "004   goa-agents    9 svc     Active", "005   pos-cloud     2 AZ      Idle", "006   job-search    100%      Active",
  ]);
  if (command === "uptime") return response("UPTIME", ["up 5+ years learning systems · load average: curious, rigorous, shipping"]);
  if (command === "date" || command.startsWith("date ")) return response("SYSTEM_DATE", [new Date().toString()]);
  if (command === "free" || command.startsWith("free ")) return response("MEMORY", ["              total       used       free      shared  buff/cache", "Mem:           64Gi       20Gi       31Gi       1.2Gi       13Gi", "Swap:           8Gi        0Gi        8Gi"]);
  if (command === "df" || command.startsWith("df ")) return response("FILESYSTEM_USAGE", ["Filesystem       Size  Used Avail Use% Mounted on", "portfolio-root   23R    17R    6R  74% /home/ahmed/portfolio", "project-archive   4R     4R    0R 100% /projects"]);
  if (command === "env" || command === "printenv") return response("ENVIRONMENT", ["USER=ahmed", "ROLE=Backend_Engineer", "LOCATION=Alexandria_Egypt", "SHELL=/bin/portfolio-zsh", "STATUS=OPEN_TO_RELOCATION_AND_REMOTE", "EDITOR=first_principles"]);
  if (command.startsWith("find")) return makeResponse("tree", id);
  if (command.startsWith("grep ") || command.startsWith("rg ")) return response("SEARCH_RESULTS", ["Searchable records: about.txt · skills.sys · experience.log · education.rec · certs.key · contact.link · projects/*.md", "Tip: use `cat <file>` or a focused portfolio command to inspect the matching record."]);
  if (command.startsWith("which ")) return response("COMMAND_PATH", [`/usr/local/bin/${command.slice(6).trim()}`]);
  if (command === "git status") return response("GIT_STATUS", ["On branch main", "Your portfolio is up to date with 'origin/main'.", "nothing to commit, working tree clean"]);
  if (command === "git log" || command.startsWith("git log ")) return response("RECENT_COMMITS", ["0410abc feat: build systems from first principles", "0db0600 perf: reduce storage read latency", "410cafe feat: ship multi-agent opportunity platform", "722test test: harden multi-tenant POS boundaries"]);
  if (command === "git remote -v") return response("GIT_REMOTES", ["origin  https://github.com/Gliitchhh410 (fetch)", "origin  https://github.com/Gliitchhh410 (push)"], [{ label: "OPEN_GITHUB", href: "https://github.com/Gliitchhh410" }]);
  if (command.startsWith("git ")) return response("GIT", ["This portfolio exposes read-only Git metadata. Try `git status`, `git log`, or `git remote -v`."]);
  if (command.startsWith("echo ")) return response("STDOUT", [raw.trim().slice(5)]);
  if (command === "man" || command.startsWith("man ") || command === "info") return makeResponse("help", id);
  if (command.startsWith("curl")) return response("HTTP/2 200", ["content-type: application/json", "", '{"name":"Ahmed Mounir","role":"Backend Engineer","status":"available","location":"Alexandria, Egypt"}']);
  if (command.startsWith("ssh")) return makeResponse("contact", id);
  if (command.startsWith("sudo")) return response("SUDO", ["ahmed is already trusted to operate this portfolio. No privilege escalation required."]);
  if (/^(rm|mv|cp|mkdir|rmdir|touch|chmod|chown|kill|pkill|reboot|shutdown)( |$)/.test(command)) return { id, kind: "error", title: "READ_ONLY_FILESYSTEM", lines: [`${command.split(" ")[0]}: operation blocked`, "Portfolio records are immutable in guest sessions."] };
  if (/^(vim|vi|nano|emacs)( |$)/.test(command)) return response("READ_ONLY_EDITOR", ["Interactive editing is disabled. Use `cat`, `less`, `head`, or `tail` to read portfolio files."]);
  if (command === "about") return response("IDENTITY_RECORD // AHMED_MOUNIR_ALI", [
    "Backend Engineer · Alexandria, Egypt · Open to relocation and remote roles.",
    "Focused on distributed systems, database internals, cloud-native architecture, and applied AI.",
    "I build multi-tenant SaaS, event-driven microservices, data pipelines, and performance-oriented systems from first principles.",
    "Current: Backend Engineer (Contract) at Saspod, Scotland, UK — remote.",
  ]);
  if (["skills", "stack"].includes(command)) return response("TECHNICAL_INVENTORY", [
    "LANGUAGES   Go · TypeScript/JavaScript · Python · PHP · SQL · Bash",
    "BACKEND     Node.js · Express · NestJS · Laravel · REST · WebSockets · SQS",
    "DATA        PostgreSQL · MySQL · MongoDB · Redis · pgvector",
    "INTERNALS   LSM trees · WAL · SSTables · Bloom filters · storage engines",
    "CLOUD       AWS ECS · ALB · RDS · S3 · SQS · Lambda · Terraform · Docker",
    "OBSERVE     Linux · Prometheus · Grafana",
    "AI          RAG · vector search · embeddings · LLM APIs · LangChain",
  ]);
  if (["experience", "work"].includes(command)) return response("CAREER_LOG // SASPOD", [
    "[APR 2026 — PRESENT] BACKEND ENGINEER (CONTRACT) · SCOTLAND, UK · REMOTE",
    "> Building the core of a multi-tenant podcast SaaS with TypeScript, Express, and PostgreSQL.",
    "> Designed tenant-safe auth and RBAC with Redis-backed refresh-token rotation.",
    "> Automated a secure three-step user invitation and studio/client onboarding flow.",
    "> Containerized services and built purge scheduling for data-retention compliance.",
  ]);
  if (command === "projects" || command === "ls projects") return response("PROJECT_ARCHIVE", PROJECTS.map((p, i) => `${String(i + 1).padStart(2, "0")}  ${p.slug.padEnd(11)} ${p.title}  [${p.status}]`).concat("Run: project <slug>"));
  if (command.startsWith("project ")) {
    const project = PROJECTS.find((item) => item.slug === command.slice(8));
    if (project) return response(`OPERATION // ${project.title.toUpperCase()}`, [`STATUS  ${project.status}`, `STACK   ${project.stack.join(" · ")}`, "", project.summary, "", ...project.highlights.map((line) => `> ${line}`)], project.links);
  }
  if (command === "education") return response("EDUCATION_RECORD", [
    "[2025 — 2026] Information Technology Institute (ITI)",
    "9-Month Professional Training Program · Open Source Application Development · Alexandria",
    "",
    "[2020 — 2025] Alexandria University",
    "B.Sc. Electrical and Electronics Engineering · CGPA 3.24",
  ]);
  if (["certifications", "certs"].includes(command)) return response("VERIFIED_CREDENTIALS", [
    "✓ AWS Certified Solutions Architect — Associate",
    "✓ AWS Certified Cloud Practitioner",
    "✓ Machine Learning Specialization — DeepLearning.AI",
    "✓ Deep Learning Specialization — DeepLearning.AI",
    "✓ IELTS Academic — Band 8.0/9.0",
  ]);
  if (command === "contact") return response("SECURE_UPLINK // READY", ["Alexandria, Egypt · Open to relocation and remote opportunities."], [
    { label: "EMAIL", href: "mailto:ahmedmounir532@gmail.com" },
    { label: "LINKEDIN", href: "https://www.linkedin.com/in/ahmed-mounir-ali410" },
    { label: "GITHUB", href: "https://github.com/Gliitchhh410" },
    { label: "PHONE", href: "tel:+201277841054" },
  ]);
  if (["resume", "cv"].includes(command)) return response("RESUME_ARCHIVE", ["The full two-page CV is ready."], [{ label: "DOWNLOAD_CV.PDF", href: "/Ahmed_Mounir_Backend.pdf", download: true }]);
  if (command === "github") return response("GITHUB_SIGNAL // GLIITCHHH410", ["23 public repositories · 40 stars · 12 followers", "Pinned systems work: chill-db · chill-http · Save-A-Bite · POS"], [{ label: "OPEN_PROFILE", href: "https://github.com/Gliitchhh410" }]);
  if (command === "status") return response("LIVE_SYSTEM_STATUS", ["ROLE          Backend Engineer @ Saspod", "LOCATION      Alexandria, Egypt", "AVAILABILITY  Open to relocation and remote", "FOCUS         Distributed systems · storage internals · cloud · applied AI", "KERNEL        AHMED-OS v2.0 — OPERATIONAL"]);
  return { id, kind: "error", title: "COMMAND_NOT_FOUND", lines: [`No record named “${raw.trim()}”.`, "Run `help` to inspect available commands."] };
}

function Clock() {
  const [value, setValue] = useState("--:--:--");
  useEffect(() => {
    const update = () => setValue(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: "Africa/Cairo" }).format(new Date()));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);
  return <span>{value}</span>;
}

function WindowFrame({ name, title, position, size, zIndex, minimized, maximized, onFocus, onDrag, onResize, onClose, onMinimize, onMaximize, className = "", children }: {
  name: WindowName; title: string; position: Position; size: WindowSize; zIndex: number; minimized: boolean; maximized: boolean;
  onFocus: () => void; onDrag: (event: ReactPointerEvent<HTMLDivElement>) => void; onResize: (event: ReactPointerEvent<HTMLDivElement>) => void; onClose: () => void; onMinimize: () => void; onMaximize: () => void; className?: string; children: ReactNode;
}) {
  const style: CSSProperties = maximized ? { zIndex, left: 18, top: 18, transform: "none" } : { zIndex, left: 0, top: 0, width: size.width, height: size.height, transform: `translate3d(${position.x}px, ${position.y}px, 0)` };
  return (
    <section className={`desktop-window ${name}-window ${minimized ? "minimized" : ""} ${maximized ? "maximized" : ""} ${className}`} style={style} onPointerDown={onFocus} aria-label={`${title} window`}>
      <div className="window-bar" onPointerDown={onDrag} onDoubleClick={onMaximize}>
        <div className="traffic-lights">
          <button type="button" className="close" onPointerDown={(event) => event.stopPropagation()} onClick={onClose} aria-label={`Close ${title}`} />
          <button type="button" className="minimize" onPointerDown={(event) => event.stopPropagation()} onClick={onMinimize} aria-label={`Minimize ${title}`} />
          <button type="button" className="maximize" onPointerDown={(event) => event.stopPropagation()} onClick={onMaximize} aria-label={`Maximize ${title}`} />
        </div>
        <span>{title}</span>
        <b>{name === "terminal" ? "zsh" : `PID-${name.length}410`}</b>
      </div>
      {!minimized && <div className="window-body">{children}</div>}
      {!minimized && !maximized && <div className="resize-handle" onPointerDown={onResize} role="separator" aria-label={`Resize ${title}`} aria-orientation="horizontal" />}
    </section>
  );
}

export default function DesktopPortfolio() {
  const [booting, setBooting] = useState(true);
  const [bootLeaving, setBootLeaving] = useState(false);
  const [positions, setPositions] = useState(DEFAULT_POSITIONS);
  const [sizes, setSizes] = useState(DEFAULT_SIZES);
  const [open, setOpen] = useState<Record<WindowName, boolean>>({ about: true, terminal: true, tasks: true, monitor: true });
  const [minimized, setMinimized] = useState<Record<WindowName, boolean>>({ about: false, terminal: false, tasks: false, monitor: false });
  const [maximized, setMaximized] = useState<Record<WindowName, boolean>>({ about: false, terminal: false, tasks: false, monitor: false });
  const [zOrder, setZOrder] = useState<Record<WindowName, number>>({ about: 3, terminal: 6, tasks: 5, monitor: 4 });
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [cwd, setCwd] = useState("~");
  const [blocks, setBlocks] = useState<Block[]>([{ id: 1, kind: "system", title: "AHMED-OS v2.0", lines: ["Kernel online. Portfolio filesystem mounted.", "Type `help` to inspect all records."] }]);
  const dragRef = useRef<{ name: WindowName; startX: number; startY: number; origin: Position; size: WindowSize } | null>(null);
  const resizeRef = useRef<{ name: WindowName; startX: number; startY: number; origin: WindowSize; position: Position } | null>(null);
  const stageRef = useRef<HTMLElement>(null);
  const nextId = useRef(2);
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let hideTimer = 0;
    const timer = window.setTimeout(() => {
      setBootLeaving(true);
      hideTimer = window.setTimeout(() => setBooting(false), 720);
    }, 1350);
    return () => { window.clearTimeout(timer); window.clearTimeout(hideTimer); };
  }, []);
  useEffect(() => {
    const move = (event: PointerEvent) => {
      const drag = dragRef.current;
      const resize = resizeRef.current;
      const stage = stageRef.current;
      if (!stage || (!drag && !resize)) return;
      const rect = stage.getBoundingClientRect();
      const scale = rect.width / stage.offsetWidth || 1;
      if (drag) {
        const nextX = drag.origin.x + (event.clientX - drag.startX) / scale;
        const nextY = drag.origin.y + (event.clientY - drag.startY) / scale;
        const minX = -rect.left / scale;
        const maxX = (window.innerWidth - rect.left) / scale - drag.size.width;
        const maxY = (window.innerHeight - rect.top) / scale - drag.size.height - 28;
        setPositions((current) => ({ ...current, [drag.name]: { x: Math.min(Math.max(minX, nextX), Math.max(minX, maxX)), y: Math.min(Math.max(0, nextY), Math.max(0, maxY)) } }));
      }
      if (resize) {
        const availableWidth = (window.innerWidth - rect.left) / scale - resize.position.x;
        const availableHeight = (window.innerHeight - rect.top) / scale - resize.position.y - 28;
        const width = Math.min(Math.max(MIN_SIZES[resize.name].width, resize.origin.width + (event.clientX - resize.startX) / scale), Math.max(MIN_SIZES[resize.name].width, availableWidth));
        const height = Math.min(Math.max(MIN_SIZES[resize.name].height, resize.origin.height + (event.clientY - resize.startY) / scale), Math.max(MIN_SIZES[resize.name].height, availableHeight));
        setSizes((current) => ({ ...current, [resize.name]: { width, height } }));
      }
    };
    const up = () => { dragRef.current = null; resizeRef.current = null; };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, []);
  useEffect(() => {
    outputRef.current?.scrollTo({ top: outputRef.current.scrollHeight, behavior: "smooth" });
  }, [blocks]);

  const focusWindow = (name: WindowName) => setZOrder((current) => ({ ...current, [name]: Math.max(...Object.values(current)) + 1 }));
  const startDrag = (name: WindowName, event: ReactPointerEvent<HTMLDivElement>) => {
    if (maximized[name] || (event.target as HTMLElement).closest("button")) return;
    focusWindow(name);
    dragRef.current = { name, startX: event.clientX, startY: event.clientY, origin: positions[name], size: sizes[name] };
  };
  const startResize = (name: WindowName, event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    focusWindow(name);
    resizeRef.current = { name, startX: event.clientX, startY: event.clientY, origin: sizes[name], position: positions[name] };
  };
  const toggleWindow = (name: WindowName) => {
    setOpen((current) => ({ ...current, [name]: true }));
    setMinimized((current) => ({ ...current, [name]: false }));
    focusWindow(name);
    if (name === "terminal") window.setTimeout(() => inputRef.current?.focus(), 0);
  };
  const frameProps = (name: WindowName) => ({
    name, position: positions[name], size: sizes[name], zIndex: zOrder[name], minimized: minimized[name], maximized: maximized[name],
    onFocus: () => focusWindow(name), onDrag: (event: ReactPointerEvent<HTMLDivElement>) => startDrag(name, event),
    onResize: (event: ReactPointerEvent<HTMLDivElement>) => startResize(name, event),
    onClose: () => setOpen((current) => ({ ...current, [name]: false })),
    onMinimize: () => setMinimized((current) => ({ ...current, [name]: !current[name] })),
    onMaximize: () => setMaximized((current) => ({ ...current, [name]: !current[name] })),
  });
  const execute = (raw: string) => {
    const command = raw.trim();
    if (!command) return;
    const normalized = command.toLowerCase().replace(/\s+/g, " ");
    if (["clear", "reset"].includes(normalized)) setBlocks([]);
    else if (normalized === "history") setBlocks((current) => [...current, { id: nextId.current++, kind: "command", title: cwd, lines: [command] }, { id: nextId.current++, kind: "response", title: "COMMAND_HISTORY", lines: [...history, command].map((item, index) => `${String(index + 1).padStart(3)}  ${item}`) }]);
    else if (normalized === "exit" || normalized === "logout") {
      setBlocks((current) => [...current, { id: nextId.current++, kind: "command", title: cwd, lines: [command] }, { id: nextId.current++, kind: "response", title: "SESSION", lines: ["Terminal minimized. Use the dock to restore the session."] }]);
      window.setTimeout(() => setMinimized((current) => ({ ...current, terminal: true })), 300);
    } else if (normalized === "cd" || normalized.startsWith("cd ")) {
      const target = normalized.slice(2).trim();
      const destination = !target || target === "~" || target === "/home/ahmed/portfolio" || target === ".." ? "~" : ["projects", "./projects", "~/projects"].includes(target) ? "~/projects" : null;
      setBlocks((current) => [...current, { id: nextId.current++, kind: "command", title: cwd, lines: [command] }, destination ? { id: nextId.current++, kind: "response", title: "DIRECTORY_CHANGED", lines: [destination === "~" ? "/home/ahmed/portfolio" : "/home/ahmed/portfolio/projects"] } : { id: nextId.current++, kind: "error", title: "NO_SUCH_DIRECTORY", lines: [`cd: ${target}: No such portfolio directory`] }]);
      if (destination) setCwd(destination);
    } else if ((normalized === "ls" || normalized.startsWith("ls ")) && cwd === "~/projects") {
      const longFormat = normalized.includes("-l");
      setBlocks((current) => [...current, { id: nextId.current++, kind: "command", title: cwd, lines: [command] }, { id: nextId.current++, kind: "response", title: longFormat ? "PROJECT_DIRECTORY // LONG_FORMAT" : "PROJECT_DIRECTORY", lines: PROJECTS.map((project) => longFormat ? `-r--r--r--  ${project.slug}.md${" ".repeat(Math.max(1, 17 - project.slug.length))}${project.status}` : `${project.slug}.md`) }]);
    } else if (normalized === "pwd") {
      setBlocks((current) => [...current, { id: nextId.current++, kind: "command", title: cwd, lines: [command] }, { id: nextId.current++, kind: "response", title: "WORKING_DIRECTORY", lines: [cwd === "~/projects" ? "/home/ahmed/portfolio/projects" : "/home/ahmed/portfolio"] }]);
    } else setBlocks((current) => [...current, { id: nextId.current++, kind: "command", title: cwd, lines: [command] }, makeResponse(command, nextId.current++)]);
    setHistory((current) => [...current, command]);
    setHistoryIndex(-1);
    setInput("");
    toggleWindow("terminal");
  };
  const submit = (event: FormEvent) => { event.preventDefault(); execute(input); };
  const keyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      execute(input);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!history.length) return;
      const index = Math.min(historyIndex + 1, history.length - 1);
      setHistoryIndex(index); setInput(history[history.length - 1 - index] ?? "");
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      const index = historyIndex - 1; setHistoryIndex(index); setInput(index < 0 ? "" : history[history.length - 1 - index] ?? "");
    } else if (event.key === "Tab") {
      event.preventDefault();
      const match = COMPLETIONS.find((item) => item.startsWith(input.toLowerCase())); if (match) setInput(match);
    } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "l") {
      event.preventDefault(); setBlocks([]);
    }
  };

  return (
    <main className="cyber-desktop">
      <div className="scanlines" aria-hidden="true" />
      <header className="os-bar">
        <div className="os-menu"><strong>⌘ AHMED-OS</strong><span>Finder</span><span>File</span><span>View</span><span>Go</span><span>Window</span></div>
        <div className="os-health"><span>⌁ EG-ALX-1</span><span>▰ 82%</span><Clock /></div>
      </header>
      <nav className="cyber-nav" aria-label="Portfolio controls">
        <button className="cyber-brand" type="button" onClick={() => toggleWindow("about")}>AM<span>.</span></button>
        <button className="active" type="button" onClick={() => toggleWindow("terminal")}>HOME</button>
        <button type="button" onClick={() => execute("projects")}>PROJECTS</button>
        <button type="button" onClick={() => execute("resume")}>RESUME</button>
        <i aria-hidden="true" />
        <a href="https://github.com/Gliitchhh410" target="_blank" rel="noreferrer" aria-label="GitHub">GH</a>
        <a href="https://www.linkedin.com/in/ahmed-mounir-ali410" target="_blank" rel="noreferrer" aria-label="LinkedIn">IN</a>
      </nav>

      <section className="desktop-stage" ref={stageRef} aria-label="Interactive cyber desktop">
        <div className="hero-identity" aria-hidden="true"><span>AHMED</span><strong>MOUNIR</strong><p>BACKEND ENGINEER · DISTRIBUTED SYSTEMS · CLOUD · APPLIED AI</p></div>

        {open.about && <WindowFrame {...frameProps("about")} title="about_ahmed.txt">
          <div className="about-file">
            <p className="file-kicker"># WHO_AM_I.TXT</p>
            <h1>Ahmed Mounir</h1>
            <h2>Backend Engineer</h2>
            <p>Alexandria, Egypt · Open to relocation &amp; remote</p>
            <div className="availability"><i /> STATUS: AVAILABLE</div>
            <div className="about-stats"><div><b>23</b><span>PUBLIC REPOS</span></div><div><b>8.0</b><span>IELTS BAND</span></div></div>
            <button type="button" onClick={() => execute("about")}>RUN ABOUT()</button>
          </div>
        </WindowFrame>}

        {open.terminal && <WindowFrame {...frameProps("terminal")} title="terminal — ahmed@portfolio">
          <div className="terminal-screen" ref={outputRef} role="log" aria-live="polite">
            <pre className="terminal-logo" aria-label="AM OS v2.0">{String.raw`    _    __  __
   / \  |  \/  |
  / _ \ | |\/| |
 / ___ \| |  | |
/_/   \_\_|  |_|  OS v2.0`}</pre>
            {blocks.map((block) => <div className={`terminal-block ${block.kind}`} key={block.id}>
              {block.kind === "command" ? <p className="terminal-echo"><b>➜</b> <span>{block.title ?? "~"}</span> {block.lines[0]}</p> : <>
                {block.title && <h2>{block.title}</h2>}
                {block.lines.map((line, index) => <p key={`${block.id}-${index}`}>{line || "\u00a0"}</p>)}
                {block.links && <div className="terminal-links">{block.links.map((link) => <a key={link.label} href={link.href} download={link.download} target={link.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">[ {link.label} ]</a>)}</div>}
              </>}
            </div>)}
          </div>
          <form className="command-line" onSubmit={submit}>
            <label htmlFor="cmd" className="sr-only">Enter terminal command</label><b>➜</b><span>{cwd}</span>
            <input id="cmd" ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={keyDown} placeholder="type help" autoComplete="off" autoCapitalize="none" spellCheck={false} />
            <button type="submit">RUN ↵</button>
          </form>
        </WindowFrame>}

        {open.tasks && <WindowFrame {...frameProps("tasks")} title="project_archive">
          <div className="project-archive">
            <div className="archive-heading"><span>DECLASSIFIED OPERATIONS</span><b>4 records</b></div>
            {PROJECTS.map((project, index) => <button type="button" key={project.slug} onClick={() => execute(`project ${project.slug}`)}>
              <span>{String(index + 1).padStart(3, "0")}</span><strong>{project.slug}</strong><em>{project.status}</em><b>↗</b>
            </button>)}
          </div>
        </WindowFrame>}

        {open.monitor && <WindowFrame {...frameProps("monitor")} title="stack_matrix">
          <div className="stack-matrix">
            <div className="stack-heading"><span>CORE CAPABILITIES</span><button type="button" onClick={() => execute("skills")}>RUN SKILLS()</button></div>
            <button type="button" onClick={() => execute("skills")}><span>LANGUAGES</span><strong>Go · TypeScript · Python</strong><i style={{ width: "100%" }} /></button>
            <button type="button" onClick={() => execute("project chill-db")}><span>SYSTEMS</span><strong>LSM · WAL · TCP · Concurrency</strong><i style={{ width: "100%" }} /></button>
            <button type="button" onClick={() => execute("experience")}><span>BACKEND</span><strong>Node · NestJS · Laravel · APIs</strong><i style={{ width: "100%" }} /></button>
            <button type="button" onClick={() => execute("project goa")}><span>AI / DATA</span><strong>RAG · pgvector · Redis · Agents</strong><i style={{ width: "100%" }} /></button>
            <div className="stack-signal"><span>GITHUB_SIGNAL</span><b>23 repos · 40 stars · 12 followers</b></div>
          </div>
        </WindowFrame>}

        <div className="contact-widget"><span><i /> STATUS: AVAILABLE</span><button type="button" onClick={() => execute("contact")}>INITIATE_CONTACT()</button></div>
        <div className="desktop-dock" aria-label="Application dock">
          <button type="button" className={open.terminal ? "on" : ""} onClick={() => toggleWindow("terminal")} aria-label="Open terminal">›_</button>
          <button type="button" className={open.monitor ? "on" : ""} onClick={() => toggleWindow("monitor")} aria-label="Open stack matrix">⌁</button>
          <button type="button" className={open.tasks ? "on" : ""} onClick={() => toggleWindow("tasks")} aria-label="Open project archive">▣</button>
          <button type="button" className={open.about ? "on" : ""} onClick={() => toggleWindow("about")} aria-label="Open identity record">♙</button>
          <i aria-hidden="true" />
          <button type="button" onClick={() => execute("projects")} aria-label="Open project archive">⌕</button>
          <a href="/Ahmed_Mounir_Backend.pdf" download aria-label="Download resume">CV</a>
          <button type="button" onClick={() => execute("contact")} aria-label="Open contact channels">✉</button>
        </div>
        <div className="desktop-status"><span><i /> SYSTEM OPERATIONAL</span><span>23 REPOS</span><span>BACKEND KERNEL v2.0</span></div>
      </section>

      {booting && <div className={`boot-overlay ${bootLeaving ? "leaving" : ""}`} role="status" aria-live="polite">
        <div className="boot-copy"><div><b>MODULAR BACKEND BIOS v2.0</b><span>Cloud Native Ready</span></div><hr />
          <p>Memory test .............................. 64GB OK</p><p>Mounting portfolio filesystem .............. 17 records</p><p>Starting terminal and live processes ........ OK</p><p className="boot-cursor">_</p>
        </div><button type="button" onClick={() => { setBootLeaving(true); window.setTimeout(() => setBooting(false), 720); }}>SKIP BOOT</button>
      </div>}
    </main>
  );
}

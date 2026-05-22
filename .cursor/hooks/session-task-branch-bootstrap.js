const { execSync } = require("node:child_process");

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function readPromptText(payload, raw) {
  if (!payload || typeof payload !== "object") return raw;
  const candidates = [
    payload.prompt,
    payload.userPrompt,
    payload.text,
    payload.input,
    payload.message,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) return candidate;
  }
  return raw;
}

function runGit(command) {
  return execSync(command, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}

function currentBranch() {
  try {
    return runGit("git rev-parse --abbrev-ref HEAD");
  } catch {
    return null;
  }
}

function isDirtyWorktree() {
  try {
    return runGit("git status --porcelain").length > 0;
  } catch {
    return false;
  }
}

function inferPrefix(text) {
  const normalized = text.toLowerCase();
  if (/(fix|bug|hotfix|오류|버그)/i.test(normalized)) return "fix/";
  if (/(docs|문서|readme)/i.test(normalized)) return "docs/";
  if (/(chore|설정|리팩터링|정리|mcp)/i.test(normalized)) return "chore/";
  return "feature/";
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function defaultSlug() {
  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return `task-${yyyy}${mm}${dd}-${hh}${min}`;
}

function branchExists(branch) {
  try {
    runGit(`git show-ref --verify --quiet refs/heads/${branch}`);
    return true;
  } catch {
    return false;
  }
}

function checkoutBranch(branch) {
  if (branchExists(branch)) {
    runGit(`git checkout ${branch}`);
    return "switched";
  }
  runGit(`git checkout -b ${branch}`);
  return "created";
}

function makeResponse(permission, userMessage, agentMessage) {
  const response = { permission };
  if (userMessage) response.user_message = userMessage;
  if (agentMessage) response.agent_message = agentMessage;
  return response;
}

const chunks = [];
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => chunks.push(chunk));
process.stdin.on("end", () => {
  const raw = chunks.join("");
  const payload = safeParse(raw);
  const promptText = readPromptText(payload, raw);
  const branch = currentBranch();

  if (!branch) {
    process.stdout.write(JSON.stringify(makeResponse("allow")));
    return;
  }

  if (branch !== "main" && branch !== "master") {
    process.stdout.write(JSON.stringify(makeResponse("allow")));
    return;
  }

  if (isDirtyWorktree()) {
    process.stdout.write(
      JSON.stringify(
        makeResponse(
          "allow",
          "main 브랜치에 변경사항이 있어 자동 브랜치 생성을 건너뜁니다. 변경 정리 후 다시 시도해 주세요.",
          "Skipped auto-branch bootstrap because worktree is dirty on main/master.",
        ),
      ),
    );
    return;
  }

  const prefix = inferPrefix(promptText);
  const slug = slugify(promptText) || defaultSlug();
  const targetBranch = `${prefix}${slug}`;

  try {
    const action = checkoutBranch(targetBranch);
    const status = runGit("git status --short --branch");
    const message =
      action === "created"
        ? `작업명 기반 브랜치 '${targetBranch}'를 생성하고 전환했습니다.`
        : `작업명 기반 브랜치 '${targetBranch}'로 전환했습니다.`;

    process.stdout.write(
      JSON.stringify(
        makeResponse(
          "allow",
          `${message}\n${status}`,
          `Auto branch bootstrap: ${action} ${targetBranch}`,
        ),
      ),
    );
  } catch {
    process.stdout.write(
      JSON.stringify(
        makeResponse(
          "allow",
          "자동 브랜치 생성에 실패했습니다. 수동으로 브랜치를 만들어 주세요.",
          "Auto branch bootstrap failed while running git checkout.",
        ),
      ),
    );
  }
});

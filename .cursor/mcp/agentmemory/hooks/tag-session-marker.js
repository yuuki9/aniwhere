const chunks = [];

process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => chunks.push(chunk));
process.stdin.on("end", () => {
  const raw = chunks.join("");
  const completionTagRegex = /#task-done/i;
  const sessionSwitchTagRegex = /#new-session/i;

  let response = { permission: "allow" };

  if (sessionSwitchTagRegex.test(raw)) {
    response = {
      permission: "allow",
      user_message:
        "Session switch tag detected. Create an agentmemory session marker first, save a short handoff memory, then start a new chat session.",
      agent_message:
        "Treat this as a boundary marker: generate a session_id marker via agentmemory-memory_save, store handoff details, and continue in a fresh session.",
    };
  } else if (completionTagRegex.test(raw)) {
    response = {
      permission: "allow",
      user_message:
        "Task completion tag detected. Save task summary first, then use #new-session for the next task.",
      agent_message:
        "Task done boundary detected. Confirm summary and sensitive data, store memory, and guide user to start a new session with #new-session.",
    };
  }

  process.stdout.write(JSON.stringify(response));
});

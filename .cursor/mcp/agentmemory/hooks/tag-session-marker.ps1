$raw = [Console]::In.ReadToEnd()

# User marks task/session completion with an ASCII hashtag.
# This hook does not auto-save memory; it only adds a safe reminder.
$completionTagRegex = '(?i)#task-done'
$sessionSwitchTagRegex = '(?i)#new-session'

if ($raw -match $sessionSwitchTagRegex) {
  $response = @{
    permission = "allow"
    user_message = "Session switch tag detected. Create an agentmemory session marker first, save a short handoff memory, then start a new chat session."
    agent_message = "Treat this as a boundary marker: generate a session_id marker via agentmemory-memory_save, store handoff details, and continue in a fresh session."
  }
}
elseif ($raw -match $completionTagRegex) {
  $response = @{
    permission = "allow"
    user_message = "Task completion tag detected. Save task summary first, then use #new-session for the next task."
    agent_message = "Task done boundary detected. Confirm summary and sensitive data, store memory, and guide user to start a new session with #new-session."
  }
}
else {
  $response = @{
    permission = "allow"
  }
}

$response | ConvertTo-Json -Compress

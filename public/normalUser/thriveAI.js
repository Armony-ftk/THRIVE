const chatInput = document.querySelector(".chat-input");
const chatSend = document.querySelector(".chat-send");
const chatWindow = document.querySelector(".chat-window");

function appendSystemMessage(message) {
  const messageBlock = document.createElement("div");
  messageBlock.className = "chat-msg ai";
  messageBlock.innerHTML = `
    <div class="chat-bubble">${message}</div>
    <span class="chat-time"></span>
  `;
  chatWindow.appendChild(messageBlock);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

async function sendGoal() {
  const userInput = chatInput.value.trim();
  if (!userInput) {
    appendSystemMessage("Please type a goal before sending.");
    return;
  }

  appendSystemMessage("Sending your goal to the AI planner...");

  try {
    const response = await fetch("/api/ai/plan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ goal: userInput }),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const errorMessage = payload?.error || `Server responded with ${response.status}`;
      throw new Error(errorMessage);
    }

    if (!payload || !payload.success || !payload.data) {
      throw new Error(payload?.error || "Invalid response from server.");
    }

    appendSystemMessage("AI plan received successfully. Check the console for structured data.");
    console.log("Validated AI plan:", payload.data);
    chatInput.value = "";
  } catch (error) {
    appendSystemMessage(`Error: ${error.message}`);
    console.error("AI planning failed:", error);
  }
}

chatSend.addEventListener("click", sendGoal);
chatInput.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    event.preventDefault();
    sendGoal();
  }
});

const subscriptionForm = document.getElementById("subscriptionForm");
const emailInput = document.getElementById("emailInput") || document.getElementById("email");
const subscribeBtn = document.getElementById("subscribeBtn");
const heroMessage = document.getElementById("heroMessage");
const modal = document.getElementById("questionModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const detailsForm = document.getElementById("detailsForm");
const formMessage = document.getElementById("formMessage");
const formSteps = Array.from(document.querySelectorAll(".form-step"));
const stepLabel = document.getElementById("stepLabel");
const stepDots = Array.from(document.querySelectorAll(".step-dot"));
const backStepBtn1 = document.getElementById("backStepBtn1");
const backStepBtn2 = document.getElementById("backStepBtn2");
const backStepBtn3 = document.getElementById("backStepBtn3");
const backStepBtn4 = document.getElementById("backStepBtn4");
const nextStepBtn3 = document.getElementById("nextStepBtn3");
const nextStepBtn4 = document.getElementById("nextStepBtn4");
const briefingTypeLegend = document.getElementById("briefingTypeLegend");
const topicStepLegend = document.getElementById("topicStepLegend");
const topicStepHelp = document.getElementById("topicStepHelp");
const topicSelectionGrid = document.getElementById("topicSelectionGrid");
const prioritySelectionGrid = document.getElementById("prioritySelectionGrid");
const topicSelectionCounter = document.getElementById("topicSelectionCounter");
const prioritySelectionCounter = document.getElementById("prioritySelectionCounter");
const industrySelect = document.getElementById("industrySelect");
const locationInput = document.getElementById("locationInput");
const roleSelect = document.getElementById("roleSelect");

// const topicOptions = [
//   "Politics",
//   "World",
//   "Business",
//   "Technology",
//   "AI",
//   "Health",
//   "Climate",
//   "Science",
//   "Entertainment",
//   "Culture",
//   "Leadership",
//   "Fashion",
//   "Sports",
//   "Lifestyle",
// ];

const topicOptions =[
  "World News & Politics",
  "Tech & AI",
  "Business & Leadership",
  "Health & Science",
  "Climate & Environment",
  "Culture & Entertainment",
  "Sports"
]

let pendingEmail = "";
let currentStep = 1;
const selectedTopics = new Set();
const priorityTopics = new Set();
const onboardingParams = new URLSearchParams(window.location.search);
const prefillEmailFromQuery = onboardingParams.get("email");
const sourceTopicFromQuery = onboardingParams.get("source_topic");
const sourceFromQuery = onboardingParams.get("source");
const returnToFromQuery = onboardingParams.get("return_to");
const isStandaloneOnboardingPage = window.location.pathname.toLowerCase().endsWith("/onboarding.html");
window.ONBOARDING_SOURCE_CONTEXT = {
  source: sourceFromQuery || null,
  sourceTopic: sourceTopicFromQuery || null,
};

if (prefillEmailFromQuery && emailInput) {
  emailInput.value = prefillEmailFromQuery;
  pendingEmail = prefillEmailFromQuery.trim().toLowerCase();
}

const stepTitles = {
  1: "Frequency",
  2: "Briefing Type",
  3: "Topic Selection",
  4: "Top Priorities",
  5: "Professional Info",
};

function selectedFrequency() {
  const input = document.querySelector('input[name="frequency"]:checked');
  return input ? input.value : "";
}

function selectedBriefingType() {
  const input = document.querySelector('input[name="briefingType"]:checked');
  return input ? input.value : "";
}

function selectedTopicPreferences() {
  return Array.from(selectedTopics).map((topic) => ({
    name: topic,
    priority: priorityTopics.has(topic),
  }));
}

function updateStepUI() {
  formSteps.forEach((stepEl) => {
    const stepNumber = Number(stepEl.dataset.step);
    stepEl.classList.toggle("hidden", stepNumber !== currentStep);
  });

  stepLabel.textContent = `Page ${currentStep} of 5 - ${stepTitles[currentStep]}`;
  stepDots.forEach((dot) => {
    dot.classList.toggle("active", Number(dot.dataset.stepDot) === currentStep);
  });
}

function goToStep(stepNumber) {
  currentStep = stepNumber;
  formMessage.textContent = "";
  updateStepUI();
}

function openModal() {
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  goToStep(1);
}

function closeModal() {
  if (isStandaloneOnboardingPage) {
    const safeReturnTo =
      typeof returnToFromQuery === "string" && returnToFromQuery.startsWith("/")
        ? returnToFromQuery
        : "/stories.html";
    window.location.href = safeReturnTo;
    return;
  }
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
}

function updateBriefingQuestionCopy() {
  const frequency = selectedFrequency();
  const isWeekly = frequency === "weekly";
  briefingTypeLegend.textContent = isWeekly
    ? "2) If weekly, what kind of weekly briefing?"
    : frequency === "breaking"
      ? "2) If breaking, what kind of breaking briefing?"
      : "2) If daily, what kind of daily briefing?";

  const cards = Array.from(document.querySelectorAll('#briefingTypeOptions .briefing-option-card'));
  if (cards.length !== 3) {
    return;
  }

  cards[0].querySelector(".briefing-title").textContent = "General Briefing";
  cards[1].querySelector(".briefing-title").textContent = "Focused Briefing";
  cards[2].querySelector(".briefing-title").textContent = "Both";

  cards[0].querySelector(".briefing-copy").textContent =
    "The biggest stories across politics, business, culture, health, climate, technology, and the world.";
  cards[1].querySelector(".briefing-copy").textContent =
    "A briefing built around the topics I choose.";
  cards[2].querySelector(".briefing-copy").textContent =
    "Give me the major stories, plus a few stories tailored to me.";
}

function updateTopicStepCopy() {
  const briefingType = selectedBriefingType();
  if (briefingType === "general") {
    topicStepLegend.textContent = "Any specific interests?";
    topicStepHelp.textContent = "Optional: select up to 4 topics.";
    return;
  }
  topicStepLegend.textContent = "Choose topics you care about";
  topicStepHelp.textContent = "Select up to 4 topics.";
}

function updateTopicCounters() {
  topicSelectionCounter.textContent = `${selectedTopics.size} of 4 selected`;
  prioritySelectionCounter.textContent = `${priorityTopics.size} of 2 prioritized`;
  nextStepBtn3.disabled = false;
}


function renderTopicSelectionStep() {
  topicSelectionGrid.innerHTML = "";
  topicOptions.forEach((topic) => {
    const selected = selectedTopics.has(topic);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `topic-chip${selected ? " is-selected" : ""}`;
    button.setAttribute("data-topic", topic);
    button.setAttribute("aria-pressed", selected ? "true" : "false");
    button.innerHTML = `
      <span class="topic-chip-check" aria-hidden="true">✓</span>
      <span class="topic-chip-label">${topic}</span>
    `;
    topicSelectionGrid.appendChild(button);
  });
  updateTopicCounters();
}

function renderPriorityStep() {
  prioritySelectionGrid.innerHTML = "";
  const selectedList = Array.from(selectedTopics);

  if (selectedList.length === 0) {
    prioritySelectionGrid.innerHTML = `<p class="topic-help">No selected topics yet. Go back and choose topics first.</p>`;
    updateTopicCounters();
    return;
  }

  selectedList.forEach((topic) => {
    const prioritized = priorityTopics.has(topic);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `priority-chip${prioritized ? " is-priority" : ""}`;
    button.setAttribute("data-priority-topic", topic);
    button.setAttribute("aria-pressed", prioritized ? "true" : "false");
    button.innerHTML = `
      <span class="priority-chip-label">${topic}</span>
      <span class="priority-chip-badge" aria-hidden="true">★</span>
    `;
    prioritySelectionGrid.appendChild(button);
  });

  updateTopicCounters();
}

topicSelectionGrid.addEventListener("click", (event) => {
  const chip = event.target.closest(".topic-chip");
  if (!chip) {
    return;
  }
  const topic = chip.dataset.topic;
  if (!topic) {
    return;
  }

  if (selectedTopics.has(topic)) {
    selectedTopics.delete(topic);
    priorityTopics.delete(topic);
  } else {
    if (selectedTopics.size >= 4) {
      formMessage.textContent = "You can select up to 4 topics.";
      return;
    }
    selectedTopics.add(topic);
  }

  formMessage.textContent = "";
  renderTopicSelectionStep();
  renderPriorityStep();
});

prioritySelectionGrid.addEventListener("click", (event) => {
  const chip = event.target.closest(".priority-chip");
  if (!chip) {
    return;
  }
  const topic = chip.dataset.priorityTopic;
  if (!topic || !selectedTopics.has(topic)) {
    return;
  }

  if (priorityTopics.has(topic)) {
    priorityTopics.delete(topic);
  } else {
    if (priorityTopics.size >= 2) {
      formMessage.textContent = "You can prioritize up to 2 topics.";
      return;
    }
    priorityTopics.add(topic);
  }

  formMessage.textContent = "";
  renderPriorityStep();
});


document.querySelectorAll('input[name="frequency"]').forEach((input) => {
  input.addEventListener("change", () => {
    if (!input.checked) {
      return;
    }
    document.querySelectorAll('input[name="briefingType"]').forEach((briefInput) => {
      briefInput.checked = false;
    });
    updateBriefingQuestionCopy();
    goToStep(2);
  });
});

document.querySelectorAll('input[name="briefingType"]').forEach((input) => {
  input.addEventListener("change", () => {
    if (!input.checked) {
      return;
    }
    updateTopicStepCopy();
    goToStep(3);
  });
});

document.addEventListener("click", (event) => {
  const card = event.target.closest(".briefing-option-card");
  if (!card) {
    return;
  }
  const input = card.querySelector("input");
  if (!input) {
    return;
  }

  if (input.name === "frequency") {
    input.checked = true;
    document.querySelectorAll('input[name="briefingType"]').forEach((briefInput) => {
      briefInput.checked = false;
    });
    updateBriefingQuestionCopy();
    goToStep(2);
  } else if (input.name === "briefingType") {
    input.checked = true;
    updateTopicStepCopy();
    goToStep(3);
  }
});

subscriptionForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  pendingEmail = emailInput.value.trim();
  heroMessage.classList.remove("success", "error");

  if (!pendingEmail) {
    heroMessage.textContent = "Please enter a valid email address.";
    heroMessage.classList.add("error");
    return;
  }

  try {
    subscribeBtn.disabled = true;
    subscribeBtn.textContent = "Subscribing...";
    heroMessage.textContent = "";
    const response = await fetch("/api/subscribe-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: pendingEmail }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "Unable to subscribe email.");
    }

    heroMessage.textContent = "You're in. Let's personalize your TIME newsletters.";
    heroMessage.classList.add("success");
    openModal();
  } catch (error) {
    heroMessage.textContent = error.message;
    heroMessage.classList.add("error");
  } finally {
    subscribeBtn.disabled = false;
    subscribeBtn.textContent = "Subscribe";
  }
});

closeModalBtn.addEventListener("click", closeModal);

modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

detailsForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  formMessage.textContent = "";

  const frequency = selectedFrequency();
  const briefingType = selectedBriefingType();
  const topicPreferences = selectedTopicPreferences();
  const location = locationInput.value.trim();
  const industry = industrySelect.value.trim();
  const role = roleSelect.value.trim();
  if (!frequency || !briefingType) {
    formMessage.textContent = "Please complete frequency and briefing type.";
    return;
  }
  if (topicPreferences.length > 4) {
    formMessage.textContent = "Please select no more than 4 topics.";
    return;
  }
  try {
    const response = await fetch("/api/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: pendingEmail,
        frequency,
        briefingType,
        topics: topicPreferences,
        source: window.ONBOARDING_SOURCE_CONTEXT.source,
        source_topic: window.ONBOARDING_SOURCE_CONTEXT.sourceTopic,
        professionalInfo: {
          location,
          industry,
          role,
        },
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "Unable to save details.");
    }

    formMessage.textContent = "Preferences saved. Welcome to TIME Newsletter.";
    heroMessage.textContent = "You are subscribed. Thank you for joining TIME Newsletter.";
    detailsForm.reset();
    selectedTopics.clear();
    priorityTopics.clear();
    renderTopicSelectionStep();
    renderPriorityStep();
    emailInput.value = "";
    pendingEmail = "";

    setTimeout(() => {
      closeModal();
      formMessage.textContent = "";
    }, 1100);
  } catch (error) {
    formMessage.textContent = error.message;
  }
});

backStepBtn1.addEventListener("click", () => goToStep(1));
backStepBtn2.addEventListener("click", () => goToStep(2));
backStepBtn3.addEventListener("click", () => goToStep(3));
backStepBtn4.addEventListener("click", () => {
  if (selectedBriefingType() === "general" || selectedTopics.size === 0) {
    goToStep(3);
    return;
  }
  goToStep(4);
});
nextStepBtn3.addEventListener("click", () => {
  if (selectedBriefingType() === "general" || selectedTopics.size === 0) {
    goToStep(5);
    return;
  }
  renderPriorityStep();
  goToStep(4);
});
nextStepBtn4.addEventListener("click", () => {
  goToStep(5);
});

renderTopicSelectionStep();
renderPriorityStep();
updateTopicStepCopy();
updateStepUI();

if (
  prefillEmailFromQuery &&
  isStandaloneOnboardingPage
) {
  openModal();
}

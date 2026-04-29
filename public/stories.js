const categories = [
  "Daily General Briefing",
  "World News & Politics",
  "Tech & AI",
  "Business & Leadership",
  "Health & Science",
  "Climate & Environment",
  "Culture & Entertainment",
  "Sports"
];

const categoryImages = {
  "Daily General Briefing": "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=960&q=80",
  "World News & Politics": "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=960&q=80",
  "Tech & AI": "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=960&q=80",
  "Business & Leadership": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=960&q=80",
  "Health & Science": "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=960&q=80",
  "Climate & Environment": "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=960&q=80",
  "Culture & Entertainment": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=960&q=80",
  Sports: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=960&q=80"
};

const storyCatalog = {
  "Daily General Briefing": [
    { title: "Morning briefing: markets, policy, and global risks in focus", excerpt: "A concise roundup of the top developments shaping today’s agenda." },
    { title: "Five stories to understand before lunch", excerpt: "The key headlines across politics, business, climate, culture, and technology." },
    { title: "What matters now: the signal behind the noise", excerpt: "Editors highlight the stories with the biggest impact on public life." }
  ],
  "World News & Politics": [
    { title: "Election coalitions reshape policy debates in major capitals", excerpt: "Political blocs are shifting strategy as economic pressure intensifies." },
    { title: "Diplomatic summit sets new framework for regional security", excerpt: "Leaders commit to tighter coordination after months of volatility." },
    { title: "How voting patterns changed across urban and rural districts", excerpt: "Data from recent cycles shows a widening values gap." }
  ],
  "Tech & AI": [
    { title: "AI safety standards move from principle to enforcement", excerpt: "Regulators outline practical requirements for frontier systems." },
    { title: "Chip supply dynamics are redrawing the global innovation map", excerpt: "New alliances are emerging around compute, fabs, and talent." },
    { title: "Inside the next wave of consumer AI assistants", excerpt: "Startups race to build products that solve daily high-friction tasks." }
  ],
  "Business & Leadership": [
    { title: "Executive teams rethink growth playbooks for uncertain quarters", excerpt: "Boardroom priorities are moving from expansion to resilient margins." },
    { title: "Why middle managers are becoming strategic differentiators", excerpt: "Companies are investing in decision velocity and execution quality." },
    { title: "The new rules of brand trust in a skeptical market", excerpt: "Leaders are using transparency as a competitive advantage." }
  ],
  "Health & Science": [
    { title: "Biotech funding rebounds around precision medicine bets", excerpt: "Investors are returning to platforms with real clinical momentum." },
    { title: "Public health systems test AI-assisted diagnostics at scale", excerpt: "Hospitals report faster triage in high-demand departments." },
    { title: "A closer look at long-term preventive care economics", excerpt: "Researchers model downstream savings from earlier interventions." }
  ],
  "Climate & Environment": [
    { title: "Cities accelerate adaptation plans after extreme weather cycles", excerpt: "Infrastructure upgrades are moving from proposal to procurement." },
    { title: "Energy storage breakthroughs improve grid reliability outlook", excerpt: "New battery architectures promise better performance and lifespan." },
    { title: "How corporate climate disclosures are changing investor behavior", excerpt: "Capital flows favor firms with clearer transition pathways." }
  ],
  "Culture & Entertainment": [
    { title: "Streaming strategies shift toward fewer, bigger franchises", excerpt: "Studios are prioritizing longevity over short-lived volume." },
    { title: "Fashion houses blend heritage with data-driven design", excerpt: "Creative teams are using trend intelligence in real time." },
    { title: "The global rise of cross-border storytelling formats", excerpt: "Audiences are embracing multilingual series at unprecedented scale." }
  ],
  Sports: [
    { title: "Scheduling reforms aim to reduce athlete injury risk", excerpt: "Leagues evaluate calendar models that balance demand and recovery." },
    { title: "How analytics is transforming coaching decisions in crunch time", excerpt: "Teams pair intuition with probability-driven play design." },
    { title: "The business of women’s sports enters a breakout cycle", excerpt: "Sponsorship and media rights growth are reshaping investment patterns." }
  ]
};

const storiesHeading = document.getElementById("storiesHeading");
const storiesSubheading = document.getElementById("storiesSubheading");
const storiesCategoryGrid = document.getElementById("storiesCategoryGrid");
const storiesList = document.getElementById("storiesList");
const storiesSubscribeForm = document.getElementById("storiesSubscribeForm");
const storiesEmailInput = document.getElementById("storiesEmailInput");
const storiesSubscribeBtn = document.getElementById("storiesSubscribeBtn");
const storiesSubscribeMessage = document.getElementById("storiesSubscribeMessage");

const params = new URLSearchParams(window.location.search);
const selectedInterest = params.get("interest");
const activeCategory = categories.includes(selectedInterest) ? selectedInterest : categories[0];

function renderCategories() {
  storiesCategoryGrid.innerHTML = "";
  categories.forEach((category) => {
    const link = document.createElement("a");
    link.className = `stories-category-chip${category === activeCategory ? " is-active" : ""}`;
    link.href = `./stories.html?interest=${encodeURIComponent(category)}`;
    link.textContent = category;
    storiesCategoryGrid.appendChild(link);
  });
}

function renderStories() {
  const stories = storyCatalog[activeCategory] || [];
  storiesHeading.textContent = activeCategory;
  storiesSubheading.textContent = `Showing ${stories.length} featured stories in ${activeCategory}.`;
  storiesList.innerHTML = "";
  stories.forEach((story, index) => {
    const card = document.createElement("article");
    card.className = "story-card";
    const storyImage = categoryImages[activeCategory];
    card.innerHTML = `
      <img class="story-image" src="${storyImage}" alt="${activeCategory} story image" loading="lazy" />
      <p class="story-kicker">${activeCategory}</p>
      <h2>${story.title}</h2>
      <p>${story.excerpt}</p>
    `;
    storiesList.appendChild(card);
  });
}

renderCategories();
renderStories();

if (storiesSubscribeForm) {
  storiesSubscribeForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = storiesEmailInput.value.trim().toLowerCase();
    storiesSubscribeMessage.textContent = "";
    storiesSubscribeMessage.classList.remove("success", "error");

    if (!email) {
      storiesSubscribeMessage.textContent = "Please enter a valid email address.";
      storiesSubscribeMessage.classList.add("error");
      return;
    }

    try {
      storiesSubscribeBtn.disabled = true;
      storiesSubscribeBtn.textContent = "Subscribing...";
      const response = await fetch("/api/subscribe-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Unable to subscribe email.");
      }

      storiesSubscribeMessage.textContent = "Subscribed. You're in for TIME briefings.";
      storiesSubscribeMessage.classList.add("success");
      storiesEmailInput.value = "";
    } catch (error) {
      storiesSubscribeMessage.textContent = error.message;
      storiesSubscribeMessage.classList.add("error");
    } finally {
      storiesSubscribeBtn.disabled = false;
      storiesSubscribeBtn.textContent = "Subscribe";
    }
  });
}

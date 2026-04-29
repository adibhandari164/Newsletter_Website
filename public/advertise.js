const advertiseForm = document.getElementById("advertiseForm");
const adFormMessage = document.getElementById("adFormMessage");

advertiseForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  adFormMessage.textContent = "";

  const payload = {
    companyName: document.getElementById("companyName").value.trim(),
    contactName: document.getElementById("contactName").value.trim(),
    contactEmail: document.getElementById("contactEmail").value.trim(),
    companyWebsite: document.getElementById("companyWebsite").value.trim(),
    companyIndustry: document.getElementById("companyIndustry").value.trim(),
    monthlyBudgetUsd: Number(document.getElementById("monthlyBudgetUsd").value),
    campaignGoals: document.getElementById("campaignGoals").value.trim(),
  };

  if (
    !payload.companyName ||
    !payload.contactName ||
    !payload.contactEmail ||
    !payload.companyWebsite ||
    !payload.companyIndustry ||
    !payload.campaignGoals ||
    !Number.isFinite(payload.monthlyBudgetUsd)
  ) {
    adFormMessage.textContent = "Please fill all required fields.";
    return;
  }

  try {
    const response = await fetch("/api/advertise", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "Unable to submit inquiry.");
    }

    adFormMessage.textContent = "Inquiry submitted successfully. Our team will contact you soon.";
    advertiseForm.reset();
  } catch (error) {
    adFormMessage.textContent = error.message;
  }
});

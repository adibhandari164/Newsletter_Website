const express = require("express");
const path = require("path");
const Database = require("better-sqlite3");

const app = express();
const PORT = process.env.PORT || 3000;

const dbPath = path.join(__dirname, "newsletter.db");
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'breaking')),
    briefing_type TEXT CHECK (briefing_type IN ('general', 'focused', 'both')),
    country TEXT,
    company TEXT,
    role TEXT,
    industry TEXT,
    interest_notes TEXT,
    general_interest INTEGER NOT NULL DEFAULT 0,
    profile_completed INTEGER NOT NULL DEFAULT 0,
    subscribed_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS subscriber_interests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subscriber_id INTEGER NOT NULL,
    interest_name TEXT NOT NULL,
    interest_level TEXT NOT NULL CHECK (interest_level IN ('1', '2', '3', '4', '5')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (subscriber_id) REFERENCES subscribers(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS advertiser_inquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    company_website TEXT NOT NULL,
    company_industry TEXT NOT NULL,
    monthly_budget_usd REAL NOT NULL,
    campaign_goals TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS subscriber_topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subscriber_id INTEGER NOT NULL,
    topic_name TEXT NOT NULL,
    is_priority INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (subscriber_id) REFERENCES subscribers(id) ON DELETE CASCADE
  );
`);

const subscriberTopicColumns = db.prepare(`PRAGMA table_info(subscriber_topics)`).all();
if (!subscriberTopicColumns.some((col) => col.name === "is_priority")) {
  db.exec(`ALTER TABLE subscriber_topics ADD COLUMN is_priority INTEGER NOT NULL DEFAULT 0;`);
}

const subscriberColumns = db.prepare(`PRAGMA table_info(subscribers)`).all();
const hasGeneralInterestColumn = subscriberColumns.some((col) => col.name === "general_interest");
const hasBriefingTypeColumn = subscriberColumns.some((col) => col.name === "briefing_type");
const hasCompanyColumn = subscriberColumns.some((col) => col.name === "company");
const hasRoleColumn = subscriberColumns.some((col) => col.name === "role");
const subscribersTableSqlRow = db
  .prepare(`SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'subscribers'`)
  .get();
const hasBreakingFrequencyConstraint = Boolean(
  subscribersTableSqlRow &&
  subscribersTableSqlRow.sql &&
  subscribersTableSqlRow.sql.includes("'breaking'")
);
const hasCreatedAtColumn = subscriberColumns.some((col) => col.name === "created_at");
const hasSubscribedAtColumn = subscriberColumns.some((col) => col.name === "subscribed_at");
const subscribedAtSource = hasCreatedAtColumn
  ? "COALESCE(created_at, datetime('now'))"
  : hasSubscribedAtColumn
    ? "COALESCE(subscribed_at, datetime('now'))"
    : "datetime('now')";
const briefingTypeSource = hasBriefingTypeColumn ? "COALESCE(briefing_type, 'general')" : "'general'";
const needsSubscriberMigration =
  !subscriberColumns.some((col) => col.name === "profile_completed") ||
  !hasGeneralInterestColumn ||
  !hasBriefingTypeColumn ||
  !hasCompanyColumn ||
  !hasRoleColumn ||
  !hasBreakingFrequencyConstraint ||
  subscriberColumns.some(
    (col) =>
      ["frequency", "country", "industry"].includes(col.name) &&
      Number(col.notnull) === 1
  );

if (needsSubscriberMigration) {
  if (hasGeneralInterestColumn) {
    db.exec(`
      DROP TABLE IF EXISTS subscribers_new;
      CREATE TABLE subscribers_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'breaking')),
        briefing_type TEXT CHECK (briefing_type IN ('general', 'focused', 'both')),
        country TEXT,
        company TEXT,
        role TEXT,
        industry TEXT,
        interest_notes TEXT,
        general_interest INTEGER NOT NULL DEFAULT 0,
        profile_completed INTEGER NOT NULL DEFAULT 0,
        subscribed_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      INSERT INTO subscribers_new (id, email, frequency, briefing_type, country, company, role, industry, interest_notes, general_interest, profile_completed, subscribed_at, updated_at)
      SELECT
        id,
        email,
        frequency,
        ${briefingTypeSource},
        country,
        ${hasCompanyColumn ? "company" : "NULL"},
        ${hasRoleColumn ? "role" : "NULL"},
        industry,
        interest_notes,
        COALESCE(general_interest, 0),
        CASE
          WHEN frequency IS NOT NULL AND country IS NOT NULL AND industry IS NOT NULL THEN 1
          ELSE 0
        END,
        ${subscribedAtSource},
        datetime('now')
      FROM subscribers;

      DROP TABLE subscribers;
      ALTER TABLE subscribers_new RENAME TO subscribers;
    `);
  } else {
    db.exec(`
      DROP TABLE IF EXISTS subscribers_new;
      CREATE TABLE subscribers_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'breaking')),
        briefing_type TEXT CHECK (briefing_type IN ('general', 'focused', 'both')),
        country TEXT,
        company TEXT,
        role TEXT,
        industry TEXT,
        interest_notes TEXT,
        general_interest INTEGER NOT NULL DEFAULT 0,
        profile_completed INTEGER NOT NULL DEFAULT 0,
        subscribed_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      INSERT INTO subscribers_new (id, email, frequency, briefing_type, country, company, role, industry, interest_notes, general_interest, profile_completed, subscribed_at, updated_at)
      SELECT
        id,
        email,
        frequency,
        'general',
        country,
        NULL,
        NULL,
        industry,
        interest_notes,
        0,
        CASE
          WHEN frequency IS NOT NULL AND country IS NOT NULL AND industry IS NOT NULL THEN 1
          ELSE 0
        END,
        ${subscribedAtSource},
        datetime('now')
      FROM subscribers;

      DROP TABLE subscribers;
      ALTER TABLE subscribers_new RENAME TO subscribers;
    `);
  }
}

db.exec(`
  DROP TABLE IF EXISTS subscriber_interests_new;
  CREATE TABLE IF NOT EXISTS subscriber_interests_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subscriber_id INTEGER NOT NULL,
    interest_name TEXT NOT NULL,
    interest_level TEXT NOT NULL CHECK (interest_level IN ('1', '2', '3', '4', '5')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (subscriber_id) REFERENCES subscribers(id) ON DELETE CASCADE
  );

  INSERT INTO subscriber_interests_new (id, subscriber_id, interest_name, interest_level, created_at)
  SELECT
    id,
    subscriber_id,
    interest_name,
    CASE
      WHEN interest_level = 'primary' THEN '5'
      WHEN interest_level = 'secondary' THEN '3'
      WHEN interest_level IN ('1', '2', '3', '4', '5') THEN interest_level
      ELSE '3'
    END,
    created_at
  FROM subscriber_interests;

  DROP TABLE subscriber_interests;
  ALTER TABLE subscriber_interests_new RENAME TO subscriber_interests;
`);

const upsertEmailSubscriber = db.prepare(`
  INSERT INTO subscribers (email, profile_completed, updated_at)
  VALUES (?, 0, datetime('now'))
  ON CONFLICT(email) DO UPDATE SET updated_at = datetime('now')
`);

const updateSubscriberPreferences = db.prepare(`
  UPDATE subscribers
  SET frequency = @frequency,
      briefing_type = @briefingType,
      country = @location,
      company = NULL,
      role = @role,
      industry = @industry,
      interest_notes = NULL,
      general_interest = @generalInterest,
      profile_completed = 1,
      updated_at = datetime('now')
  WHERE email = @email
`);

const getSubscriberByEmail = db.prepare(`SELECT id FROM subscribers WHERE email = ?`);
const clearSubscriberInterests = db.prepare(`DELETE FROM subscriber_interests WHERE subscriber_id = ?`);
const insertInterest = db.prepare(`
  INSERT INTO subscriber_interests (subscriber_id, interest_name, interest_level)
  VALUES (?, ?, ?)
`);
const clearSubscriberTopics = db.prepare(`DELETE FROM subscriber_topics WHERE subscriber_id = ?`);
const insertSubscriberTopic = db.prepare(`
  INSERT INTO subscriber_topics (subscriber_id, topic_name, is_priority)
  VALUES (?, ?, ?)
`);
const insertAdvertiserInquiry = db.prepare(`
  INSERT INTO advertiser_inquiries (
    company_name,
    contact_name,
    contact_email,
    company_website,
    company_industry,
    monthly_budget_usd,
    campaign_goals
  )
  VALUES (@companyName, @contactName, @contactEmail, @companyWebsite, @companyIndustry, @monthlyBudgetUsd, @campaignGoals)
`);

const saveSubscriptionTransaction = db.transaction((payload) => {
  upsertEmailSubscriber.run(payload.email);

  const existing = getSubscriberByEmail.get(payload.email);
  const subscriberId = existing.id;
  updateSubscriberPreferences.run(payload);
  clearSubscriberInterests.run(subscriberId);
  clearSubscriberTopics.run(subscriberId);

  for (const topic of payload.topics) {
    insertSubscriberTopic.run(subscriberId, topic.name, topic.priority ? 1 : 0);
  }

  return subscriberId;
});

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/subscribe-email", (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "A valid email is required." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      return res.status(400).json({ error: "A valid email is required." });
    }

    upsertEmailSubscriber.run(normalizedEmail);

    return res.status(200).json({
      success: true,
      message: "Subscribed successfully. Please complete your preferences.",
    });
  } catch (error) {
    console.error("Email subscription error:", error);
    return res.status(500).json({ error: "Unable to subscribe email." });
  }
});

app.post("/api/subscribe", (req, res) => {
  try {
    const { email, frequency, briefingType, topics, professionalInfo } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "A valid email is required." });
    }
    if (!["daily", "weekly", "breaking"].includes(frequency)) {
      return res.status(400).json({ error: "Frequency must be daily, weekly, or breaking." });
    }
    if (!["general", "focused", "both"].includes(briefingType)) {
      return res.status(400).json({ error: "Briefing type must be general, focused, or both." });
    }
    if (!Array.isArray(topics)) {
      return res.status(400).json({ error: "Topics payload is invalid." });
    }
    const normalizedTopicMap = new Map();
    topics.forEach((topic) => {
      if (typeof topic === "string") {
        const clean = topic.trim();
        if (clean) {
          normalizedTopicMap.set(clean, { name: clean, priority: false });
        }
        return;
      }
      if (topic && typeof topic.name === "string") {
        const clean = topic.name.trim();
        if (clean) {
          const existing = normalizedTopicMap.get(clean);
          normalizedTopicMap.set(clean, {
            name: clean,
            priority: Boolean(topic.priority) || (existing ? existing.priority : false),
          });
        }
      }
    });

    const normalizedTopics = Array.from(normalizedTopicMap.values());
    if (normalizedTopics.length > 4) {
      return res.status(400).json({ error: "Select no more than 4 topics." });
    }
    if (!professionalInfo || typeof professionalInfo !== "object") {
      return res.status(400).json({ error: "Professional info payload is invalid." });
    }
    const location = typeof professionalInfo.location === "string" ? professionalInfo.location.trim() : "";
    const industry = typeof professionalInfo.industry === "string" ? professionalInfo.industry.trim() : "";
    const role = typeof professionalInfo.role === "string" ? professionalInfo.role.trim() : "";

    const payload = {
      email: email.trim().toLowerCase(),
      topics: normalizedTopics,
      briefingType,
      generalInterest: 0,
      frequency,
      location: location || null,
      industry,
      role,
    };

    const subscriberId = saveSubscriptionTransaction(payload);

    return res.status(200).json({
      success: true,
      message: "Subscription details saved successfully.",
      subscriberId,
    });
  } catch (error) {
    console.error("Subscription save error:", error);
    return res.status(500).json({ error: "Unable to save subscription details." });
  }
});

app.post("/api/advertise", (req, res) => {
  try {
    const {
      companyName,
      contactName,
      contactEmail,
      companyWebsite,
      companyIndustry,
      monthlyBudgetUsd,
      campaignGoals,
    } = req.body;

    if (
      !companyName ||
      !contactName ||
      !contactEmail ||
      !companyWebsite ||
      !companyIndustry ||
      !campaignGoals
    ) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const budget = Number(monthlyBudgetUsd);
    if (!Number.isFinite(budget) || budget < 0) {
      return res.status(400).json({ error: "Monthly budget must be a valid non-negative number." });
    }

    const result = insertAdvertiserInquiry.run({
      companyName: companyName.trim(),
      contactName: contactName.trim(),
      contactEmail: contactEmail.trim().toLowerCase(),
      companyWebsite: companyWebsite.trim(),
      companyIndustry: companyIndustry.trim(),
      monthlyBudgetUsd: budget,
      campaignGoals: campaignGoals.trim(),
    });

    return res.status(200).json({
      success: true,
      message: "Advertising inquiry submitted.",
      inquiryId: result.lastInsertRowid,
    });
  } catch (error) {
    console.error("Advertiser inquiry save error:", error);
    return res.status(500).json({ error: "Unable to save advertiser inquiry." });
  }
});

app.get("/api/subscriptions", (_req, res) => {
  try {
    const rows = db
      .prepare(`
        SELECT
          s.id,
          s.email,
          s.frequency,
          s.briefing_type AS briefingType,
          s.country,
          s.company,
          s.role,
          s.industry,
          s.interest_notes AS interestNotes,
          s.general_interest AS generalInterest,
          s.profile_completed AS profileCompleted,
          s.subscribed_at AS subscribedAt,
          s.updated_at AS updatedAt,
          t.topic_name AS topicName,
          t.is_priority AS topicPriority
        FROM subscribers s
        LEFT JOIN subscriber_topics t ON t.subscriber_id = s.id
        ORDER BY s.subscribed_at DESC, t.id ASC
      `)
      .all();

    return res.status(200).json({ data: rows });
  } catch (error) {
    console.error("Fetch subscriptions error:", error);
    return res.status(500).json({ error: "Unable to fetch subscriptions." });
  }
});

app.get("/api/advertise-inquiries", (_req, res) => {
  try {
    const rows = db
      .prepare(`
        SELECT
          id,
          company_name AS companyName,
          contact_name AS contactName,
          contact_email AS contactEmail,
          company_website AS companyWebsite,
          company_industry AS companyIndustry,
          monthly_budget_usd AS monthlyBudgetUsd,
          campaign_goals AS campaignGoals,
          created_at AS createdAt
        FROM advertiser_inquiries
        ORDER BY created_at DESC
      `)
      .all();

    return res.status(200).json({ data: rows });
  } catch (error) {
    console.error("Fetch advertiser inquiries error:", error);
    return res.status(500).json({ error: "Unable to fetch advertiser inquiries." });
  }
});

app.listen(PORT, () => {
  console.log(`TIME Newsletter site running on http://localhost:${PORT}`);
});

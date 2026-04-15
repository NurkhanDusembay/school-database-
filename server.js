const path = require("path");
const express = require("express");
require("dotenv").config();

const { pool, testConnection } = require("./src/db");
const { overviewPages, isAllowedOverview, getOverviewMeta } = require("./src/overviews");
const { schoolTables, isAllowedTable, getTableMeta } = require("./src/tables");

const app = express();
const host = process.env.HOST || "127.0.0.1";
const port = process.env.PORT || 3000;
const rawTableLimit = 20;
const maxApiLimit = 200;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.locals.formatValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (value instanceof Date) {
    return value.toLocaleDateString("en-CA");
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return value;
};

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use((_, res, next) => {
  res.locals.overviewPages = overviewPages;
  res.locals.schoolTables = schoolTables;
  next();
});

function parseLimit(rawValue, fallbackLimit) {
  const parsed = Number.parseInt(rawValue, 10);

  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallbackLimit;
  }

  return Math.min(parsed, maxApiLimit);
}

async function getTableCount(tableName) {
  const result = await pool.query(`SELECT COUNT(*)::int AS total FROM ${tableName}`);
  return result.rows[0].total;
}

async function getTableColumns(tableName) {
  const result = await pool.query(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position
    `,
    [tableName]
  );

  return result.rows.map((row) => row.column_name);
}

async function getOverviewData(overviewMeta, limit = overviewMeta.limit) {
  const rowsResult = await pool.query(`${overviewMeta.sql} LIMIT $1`, [limit]);
  const columns = rowsResult.rows.length > 0 ? Object.keys(rowsResult.rows[0]) : overviewMeta.columns;

  return {
    columns,
    rows: rowsResult.rows
  };
}

async function getTableData(tableName, limit = rawTableLimit) {
  const rowsResult = await pool.query(`SELECT * FROM ${tableName} LIMIT ${limit}`);
  const columns = rowsResult.rows.length > 0 ? Object.keys(rowsResult.rows[0]) : await getTableColumns(tableName);

  return {
    columns,
    rows: rowsResult.rows
  };
}

app.get("/", async (_req, res) => {
  const overviewCards = overviewPages.map((overview) => ({
    ...overview
  }));
  const tableCards = schoolTables.map((table) => ({
    ...table,
    total: null
  }));

  let dbStatus = "Not connected";
  let dbError = "";

  try {
    await testConnection();
    dbStatus = "Connected";

    const counts = await Promise.all(
      schoolTables.map(async (table) => ({
        name: table.name,
        total: await getTableCount(table.name)
      }))
    );

    const totalByTable = new Map(counts.map((item) => [item.name, item.total]));

    tableCards.forEach((table) => {
      table.total = totalByTable.get(table.name) ?? 0;
    });
  } catch (error) {
    console.error(error);
    dbError = error.message;
  }

  res.render("index", {
    currentPage: "dashboard",
    dbStatus,
    dbError,
    overviewCards,
    tableCards
  });
});

app.get("/dashboard", (_req, res) => {
  res.redirect("/");
});

app.get("/api", (_req, res) => {
  res.json({
    name: "School Academic System API",
    message: "Beginner-friendly REST API for overview pages and raw tables.",
    endpoints: {
      health: "/api/health",
      overviewList: "/api/overviews",
      overviewItem: "/api/overviews/:overviewSlug?limit=50",
      tableList: "/api/tables",
      tableItem: "/api/tables/:tableName?limit=50"
    }
  });
});

app.get("/api/health", async (_req, res) => {
  try {
    await testConnection();
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", database: error.message });
  }
});

app.get("/api/overviews", (_req, res) => {
  res.json({
    total: overviewPages.length,
    data: overviewPages.map((overview) => ({
      slug: overview.slug,
      title: overview.title,
      description: overview.description,
      default_limit: overview.limit,
      columns: overview.columns,
      url: `/api/overviews/${overview.slug}`
    }))
  });
});

app.get("/api/overviews/:overviewSlug", async (req, res) => {
  const { overviewSlug } = req.params;

  if (!isAllowedOverview(overviewSlug)) {
    return res.status(404).json({ error: "Overview API route not found." });
  }

  const overviewMeta = getOverviewMeta(overviewSlug);
  const limit = parseLimit(req.query.limit, overviewMeta.limit);

  try {
    const { columns, rows } = await getOverviewData(overviewMeta, limit);

    return res.json({
      slug: overviewMeta.slug,
      title: overviewMeta.title,
      description: overviewMeta.description,
      limit,
      count: rows.length,
      columns,
      data: rows
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

app.get("/api/tables",(_req, res) => {
  res.json({
    total: schoolTables.length,
    data: schoolTables.map((table) => ({
      name: table.name,
      title: table.title,
      description: table.description,
      default_limit: rawTableLimit,
      url: `/api/tables/${table.name}`
    }))
  });
});

app.get("/api/tables/:tableName", async (req, res) => {
  const { tableName } = req.params;

  if (!isAllowedTable(tableName)) {
    return res.status(404).json({ error: "Table API route not found." });
  }

  const tableMeta = getTableMeta(tableName);
  const limit = parseLimit(req.query.limit, rawTableLimit);

  try {
    const { columns, rows } = await getTableData(tableName, limit);

    return res.json({
      name: tableMeta.name,
      title: tableMeta.title,
      description: tableMeta.description,
      limit,
      count: rows.length,
      columns,
      data: rows
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

app.get("/overview/:overviewSlug", async (req, res) => {
  const { overviewSlug } = req.params;

  if (!isAllowedOverview(overviewSlug)) {
    return res.status(404).render("not-found", {
      currentPage: "",
      message: "This overview page is not available in the starter dashboard."
    });
  }

  const overviewMeta = getOverviewMeta(overviewSlug);

  if (overviewMeta.loadFromApi) {
    return res.render("overview", {
      currentPage: overviewSlug,
      overviewMeta,
      columns: overviewMeta.columns,
      rows: [],
      clientFetch: true,
      apiUrl: `/api/overviews/${overviewMeta.slug}?limit=${overviewMeta.limit}`
    });
  }

  try {
    const { columns, rows } = await getOverviewData(overviewMeta, overviewMeta.limit);

    return res.render("overview", {
      currentPage: overviewSlug,
      overviewMeta,
      columns,
      rows,
      clientFetch: false
    });
  } catch (error) {
    console.error(error);
    return res.status(500).render("overview", {
      currentPage: overviewSlug,
      overviewMeta,
      columns: overviewMeta.columns,
      rows: [],
      clientFetch: false,
      error: error.message
    });
  }
});

app.get("/table/:tableName", async (req, res) => {
  const { tableName } = req.params;

  if (!isAllowedTable(tableName)) {
    return res.status(404).render("not-found", {
      currentPage: "",
      message: "This table is not available in the starter dashboard."
    });
  }

  const tableMeta = getTableMeta(tableName);

  try {
    const { columns, rows } = await getTableData(tableName, rawTableLimit);

    return res.render("table", {
      currentPage: tableName,
      tableMeta,
      columns,
      rows
    });
  } catch (error) {
    console.error(error);
    return res.status(500).render("table", {
      currentPage: tableName,
      tableMeta,
      columns: [],
      rows: [],
      error: error.message
    });
  }
});

app.get("/health", (_req, res) => {
  res.redirect("/api/health");
});

app.use("/api", (_req, res) => {
  res.status(404).json({
    error: "API route not found."
  });
});

app.use((_req, res) => {
  res.status(404).render("not-found", {
    currentPage: "",
    message: "The page you requested does not exist."
  });
});

if (require.main === module) {
  const server = app.listen(port, host, () => {
    console.log(`School academic system running at http://${host}:${port}`);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(`Could not start server: port ${port} is already in use.`);
    } else {
      console.error(`Could not start server: ${error.message}`);
    }

    process.exit(1);
  });
}

module.exports = app;

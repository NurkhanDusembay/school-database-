(function loadOverviewFromApi() {
  const tableWrap = document.querySelector("[data-overview-api]");

  if (!tableWrap) {
    return;
  }

  const apiUrl = tableWrap.dataset.overviewApi;
  const loadingCard = document.getElementById("overview-loading");
  const errorCard = document.getElementById("overview-error");
  const errorText = document.getElementById("overview-error-text");
  const emptyCard = document.getElementById("overview-empty");
  const head = document.getElementById("overview-api-head");
  const body = document.getElementById("overview-api-body");

  function showElement(element) {
    if (element) {
      element.classList.remove("is-hidden");
    }
  }

  function hideElement(element) {
    if (element) {
      element.classList.add("is-hidden");
    }
  }

  function formatColumnName(column) {
    return column.replaceAll("_", " ");
  }

  function formatValue(value) {
    if (value === null || value === undefined || value === "") {
      return "-";
    }

    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
      return value.slice(0, 10);
    }

    if (typeof value === "object") {
      return JSON.stringify(value);
    }

    return String(value);
  }

  function renderStateRow(message, columnCount) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.className = "table-state-cell";
    cell.colSpan = columnCount;
    cell.textContent = message;
    row.appendChild(cell);
    body.replaceChildren(row);
  }

  function renderTable(columns, rows) {
    const headerRow = document.createElement("tr");

    columns.forEach((column) => {
      const headerCell = document.createElement("th");
      headerCell.textContent = formatColumnName(column);
      headerRow.appendChild(headerCell);
    });

    head.replaceChildren(headerRow);

    if (rows.length === 0) {
      renderStateRow("No rows found.", columns.length);
      showElement(emptyCard);
      return;
    }

    hideElement(emptyCard);
    const tableRows = rows.map((row) => {
      const tableRow = document.createElement("tr");

      columns.forEach((column) => {
        const cell = document.createElement("td");
        cell.textContent = formatValue(row[column]);
        tableRow.appendChild(cell);
      });

      return tableRow;
    });

    body.replaceChildren(...tableRows);
  }

  fetch(apiUrl)
    .then(async (response) => {
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Request failed.");
      }

      renderTable(payload.columns || [], payload.data || []);
      hideElement(loadingCard);
      hideElement(errorCard);
    })
    .catch((error) => {
      hideElement(loadingCard);
      showElement(errorCard);
      errorText.textContent = error.message;
      renderStateRow("Could not load rows from the API.", head.querySelectorAll("th").length || 1);
    });
})();

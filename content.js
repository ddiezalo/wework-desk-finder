let stopFlag = false;

function observePage() {
  const observer = new MutationObserver(() => {
    const pageTitle = document.querySelector("h1.page-title");
    if (pageTitle && pageTitle.textContent.includes("Book a desk")) {
      if (!document.getElementById("deskCheckerBtn")) {
        injectButton();
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

observePage();

function formatDate(date) {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function parseDateFromInput() {
  const dateInput = document.querySelector("input[name='dp']");
  if (!dateInput || !dateInput.value) return new Date();

  const match = dateInput.value.match(/^([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})$/);
  if (!match) return new Date();

  const months = {Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11};
  return new Date(parseInt(match[3],10), months[match[1]], parseInt(match[2],10));
}

async function waitForResults() {
  // Always wait at least 250 ms before checking
  await new Promise(r => setTimeout(r, 250));

  for (let i = 0; i < 10; i++) { // poll for ~5 seconds
    const deskResults = document.querySelectorAll("ul.list-unstyled li .desk-info .text-primary div");
    if (deskResults.length > 0) {
      return { available: true, text: deskResults[0].textContent.trim() };
    }

    const sorryBlock = document.querySelector(".gray-box span");
    if (sorryBlock && sorryBlock.textContent.includes("Sorry")) {
      return { available: false };
    }

    await new Promise(r => setTimeout(r, 500));
  }
  return { available: false };
}

async function selectDate(date) {
  const dateInput = document.querySelector("input[name='dp']");
  if (!dateInput) {
    return false;
  }

  // Open the calendar popup
  const calendarBtn = dateInput.parentElement.querySelector("button");
  if (calendarBtn) {
    calendarBtn.click();
  } else {
    return false;
  }

  // Wait for popup to render
  await new Promise(r => setTimeout(r, 500));

  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-based
  const day = date.getDate();

  const selector = `[aria-label='${year}-${month}-${day}']`;

  const cell = document.querySelector(selector);

  if (cell) {
    cell.click();
    return true;
  } else {
    return false;
  }
}

async function findFirstAvailableDesk(resultDiv, stopBtn) {
  stopFlag = false;
  stopBtn.style.display = "inline-block";

  let currentDate = parseDateFromInput();

  for (let i = 0; i < 60; i++) {
    if (stopFlag) {
      resultDiv.textContent = "⏹️ Search stopped.";
      stopBtn.style.display = "none";
      return;
    }

    const formatted = formatDate(currentDate);
    resultDiv.textContent = `Checking ${formatted}...`;

    const submitted = await selectDate(currentDate);
    if (!submitted) {
      resultDiv.textContent = "❌ Could not select date.";
      stopBtn.style.display = "none";
      return;
    }

    const res = await waitForResults();

    if (res.available) {
      resultDiv.textContent = `✅ First available desk: ${formatted} (${res.text})`;
      stopBtn.style.display = "none";
      return;
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  resultDiv.textContent = "❌ No desks found in the next 60 days";
  stopBtn.style.display = "none";
}

function injectButton() {
  const filterBlock = document.querySelector(".quick-filter-section");
  if (!filterBlock) {
    setTimeout(injectButton, 1000);
    return;
  }

  if (document.getElementById("deskCheckerBtn")) return;

  const btn = document.createElement("button");
  btn.id = "deskCheckerBtn";
  btn.textContent = "Find First Available Desk";
  btn.style.marginLeft = "10px";
  btn.style.padding = "6px 12px";
  btn.style.backgroundColor = "#0078d4";
  btn.style.color = "white";
  btn.style.border = "none";
  btn.style.borderRadius = "4px";
  btn.style.cursor = "pointer";

  const stopBtn = document.createElement("button");
  stopBtn.id = "deskCheckerStopBtn";
  stopBtn.textContent = "Stop";
  stopBtn.style.marginLeft = "10px";
  stopBtn.style.padding = "6px 12px";
  stopBtn.style.backgroundColor = "#d83b01";
  stopBtn.style.color = "white";
  stopBtn.style.border = "none";
  stopBtn.style.borderRadius = "4px";
  stopBtn.style.cursor = "pointer";
  stopBtn.style.display = "none";

  const resultDiv = document.createElement("div");
  resultDiv.id = "deskCheckerResult";
  resultDiv.style.marginTop = "8px";
  resultDiv.style.fontWeight = "bold";

  btn.addEventListener("click", () => {
    resultDiv.textContent = "Starting search...";
    findFirstAvailableDesk(resultDiv, stopBtn);
  });

  stopBtn.addEventListener("click", () => {
    stopFlag = true;
  });

  filterBlock.appendChild(btn);
  filterBlock.appendChild(stopBtn);
  filterBlock.appendChild(resultDiv);
}

injectButton();

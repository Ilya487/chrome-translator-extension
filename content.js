const spinnerImg = chrome.runtime.getURL("spinner.svg");
const translatorIcon = chrome.runtime.getURL("translator.png");

document.body.insertAdjacentHTML(
  "beforeend",
  `
    <div class="translateBtn">
      <img class="translateIcon" src="${translatorIcon}" />
      <img class="loadearIcon" src="${spinnerImg}" />
    </div>
    `
);
document.body.insertAdjacentHTML(
  "beforeend",
  `
    <div class="translatedText">
      <p></p>
      <button class="createGoogleTranslateBtn">Google translate</button>
    </div>`
);

const translateBtn = document.querySelector(".translateBtn");
const textArea = document.querySelector(".translatedText");
const googleBtn = document.querySelector(".createGoogleTranslateBtn");

const styleClasses = {
  showTranslateBtn: "translateBtn--show-icon",
  showLoader: "translateBtn--show-loader",
  showTranslatedText: "translatedText--show",
};

let selectedText = "";
let isVisible = false;

bindEvents();

function bindEvents() {
  document.addEventListener("mousedown", e => {
    handleClickOutside(e);
    selectedText = document.getSelection().toString();
  });

  document.addEventListener("mouseup", e => {
    handleClickOutside(e);

    const currentSelectedText = document.getSelection().toString();
    if (selectedText !== currentSelectedText && currentSelectedText !== "") {
      selectedText = currentSelectedText;
      const x = e.clientX;
      const y = e.clientY;
      renderBtn(x, y);
    }
  });
}

function handleClickOutside(e) {
  const target = e.target;

  if (!translateBtn.contains(target) && !textArea.contains(target) && isVisible) {
    textArea.classList.remove(styleClasses.showTranslatedText);
    translateBtn.classList.remove(styleClasses.showTranslateBtn);
    isVisible = false;
    return;
  }
}

function renderBtn(x, y) {
  x += 8;
  y -= 5;

  const correctedCoords = clampToViewport(
    x,
    y,
    translateBtn.offsetWidth,
    translateBtn.offsetHeight
  );
  translateBtn.style.top = correctedCoords.y + "px";
  translateBtn.style.left = correctedCoords.x + "px";

  translateBtn.classList.add(styleClasses.showTranslateBtn);
  isVisible = true;
}

function renderTextArea(x, y, text) {
  textArea.querySelector("p").innerHTML = text;
  const correctedCoords = clampToViewport(x, y, textArea.offsetWidth, textArea.offsetHeight);

  textArea.style.top = correctedCoords.y + "px";
  textArea.style.left = correctedCoords.x + "px";

  textArea.classList.add(styleClasses.showTranslatedText);
  isVisible = true;
}

async function translate(text) {
  const isOneWord = text.trim(" ").split(" ", 2).length == 1;

  const resp = await fetch("http://localhost:5000/translate", {
    method: "POST",
    body: JSON.stringify({
      q: text,
      source: "en",
      target: "ru",
      ...(isOneWord && { alternatives: 3 }),
    }),
    headers: { "Content-Type": "application/json" },
  });
  if (!resp.ok) throw new Error("fetch error");

  const json = await resp.json();
  let translatedText = json.translatedText;
  if (isOneWord) {
    translatedText += "<br>" + json.alternatives.join("<br>");
  }
  return translatedText;
}

function clampToViewport(x, y, width, height) {
  const maxX = x + width;
  const maxY = y + height;
  const result = { x, y };

  const clientWidth = document.documentElement.clientWidth;
  const clientHeight = document.documentElement.clientHeight;

  if (maxX > clientWidth) {
    result.x = clientWidth - width;
  }
  if (maxX < 0) {
    result.x = 0;
  }

  if (maxY > clientHeight) {
    result.y = clientHeight - height;
  }
  if (maxY < 0) {
    result.y = 0;
  }

  result.x += window.pageXOffset;
  result.y += window.pageYOffset;
  return result;
}

function createGoogleTranslateLink(text) {
  const template = "https://translate.google.com/details?sl=en&tl=ru&op=translate";
  text = encodeURI(text);
  return template + "&text=" + text;
}

translateBtn.onclick = async e => {
  translateBtn.classList.remove(styleClasses.showTranslateBtn);
  translateBtn.classList.add(styleClasses.showLoader);

  try {
    const text = await translate(selectedText);
    renderTextArea(e.clientX, e.clientY, text);
  } catch (e) {
  } finally {
    translateBtn.classList.remove(styleClasses.showLoader);
  }
};

googleBtn.onclick = () => {
  const link = createGoogleTranslateLink(selectedText);
  window.open(link);
};

// ── 1. CONFIG ────────────────────────────────────────────
// These are the only countries we want to show in the dropdown.
const targetCountries = [
  "Philippines", "United States", "United Kingdom", "Japan", "China", "India",
  "Italy", "France", "Spain", "Germany", "Mexico", "Canada", "Brazil"
];

// ── 2. ELEMENTS ──────────────────────────────────────────
// Grab the HTML elements we need and save them as variables.
// This way we don't have to type getElementById() every single time.
const list           = document.getElementById("countryList");    // the dropdown list container
const container      = document.getElementById("recipes");         // the grid where cards appear
const sectionTitle   = document.getElementById("sectionTitle");   // the heading above the cards
const dropdown       = document.getElementById("countryDropdown"); // the whole dropdown wrapper
const dropdownToggle = document.getElementById("dropdownToggle");  // the "Country ▼" button
const searchForm     = document.getElementById("searchForm");
const searchInput    = document.getElementById("searchInput");

// ── 3. HELPERS ───────────────────────────────────────────

// Shows placeholder "skeleton" boxes while the real cards are loading.
// count = how many skeletons to show (default is 2).
function showSkeletons(count = 2) {
  container.innerHTML = "";
  for (let i = 0; i < count; i++) {
    container.innerHTML += `
      <div class="skeleton">
        <div class="skeleton-img"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line short"></div>
      </div>`;
  }
}

// Updates the heading text above the recipe grid.
function setSectionTitle(heading) {
  sectionTitle.querySelector("h2").textContent = heading;
}



// ── CARD FACTORY ────────────────────────────────────────
// Receives one meal object from the API and returns a clickable card element.
// delay = how long to wait before the card animates in (staggered effect).
function createCard(meal, delay = 0) {
  const card = document.createElement("div");
  card.className = "meal-card";
  card.style.animationDelay = `${delay}ms`; // stagger the card animations

  // Build a small tag like "Filipino · Chicken" from the meal's area and category.
  // .filter(Boolean) removes any empty/null values before joining.
  const category = meal.strCategory || "";
  // get the category from the dish, if null/undefined use empty string ""
  // ex: "Chicken"  or  ""

  const area = meal.strArea || "";
  // get the area/country from the dish, if null/undefined use empty string ""
  // ex: "Filipino"  or  ""

  const tagText = [area, category].filter(Boolean).join(" · ");
  // remove any empty strings "" or null
  // if area="" it gets removed
  // ["Filipino", "Chicken"]  ← both kept
  // ["", "Chicken"]          ← becomes ["Chicken"]
  // ["", ""]                 ← becomes []
  // combine what's left with " · " in between
  // "Filipino · Chicken"
  // "Chicken"
  // ""  (empty, nothing to join)

  // Inject the image, name, and tag into the card using a template literal.
  card.innerHTML = `
    <img src="${meal.strMealThumb}" alt="${meal.strMeal}" >
    <div class="card-body">
      <h6>${meal.strMeal}</h6>
      ${tagText ? `<span class="tag">${tagText}</span>` : ""}
    </div>`;

  // When the user clicks this card:
  // 1. Save the meal's ID to localStorage (browser's temporary memory).
  // 2. Navigate to recipe.html — that page reads the ID and shows full details.
  card.addEventListener("click", () => {
    localStorage.setItem("selectedMealId", meal.idMeal);
    window.location.href = "recipe.html";
  });

  return card; // return the finished card so it can be added to the page
}

// ── 4. DROPDOWN ──────────────────────────────────────────
// When the user clicks the "Country" button, open or close the dropdown.
// e.stopPropagation() prevents this click from also firing the
// document listener below (which would immediately close it again).
dropdownToggle.addEventListener("click", (e) => {
  e.stopPropagation();
  dropdown.classList.toggle("open"); // adds "open" if missing, removes it if present
});

// When the user clicks anywhere else on the page, close the dropdown.
document.addEventListener("click", () => dropdown.classList.remove("open"));

// Fetch areas from the API, filter to our target countries,
// then build a button for each one.
async function buildDropdown() {
  try {
    const res  = await fetch("https://www.themealdb.com/api/json/v1/1/list.php?a=list");
    const data = await res.json();

    // Filter the API results to only the countries we want.
    // meal.strCountry = "United States" → used as the button label
    // meal.strArea    = "American"      → used for the filter API call
    const filtered = data.meals.filter(meal =>
      targetCountries.includes(meal.strCountry)
    );

    // Loop through each matched country and create one button for it automatically.
    // This saves us from writing a button for each country manually in HTML.
 filtered.forEach(meal => {
  const btn = document.createElement("button"); // create a <button> element
  btn.textContent = meal.strCountry;            // set the button label e.g. "United States"
  btn.addEventListener("click", () => {
    dropdown.classList.remove("open");  // close the dropdown when a country is picked
    getCountryFood(meal.strCountry);    // pass "United States" directly to the filter API
  });
  list.appendChild(btn); // add the button into the dropdown menu in the HTML
});

  } catch {
    console.error("Failed to load country list from API.");
  }
}

// ── 5. RANDOM RECIPES ────────────────────────────────────
// Fetches 20 random meals from the API at the same time using Promise.all.
// This is faster than fetching them one by one.
async function getRandomRecipes() {
  setSectionTitle("Today's Random Picks");
  showSkeletons(20); // show placeholders while loading

  // Create 20 fetch requests at once. Promise.all waits for ALL of them to finish.
  const promises = Array.from({ length: 20 }, () =>
    fetch("https://www.themealdb.com/api/json/v1/1/random.php") // sends the request
                                                                 // returns a Response object
      .then(r => r.json())   // convert response to JS object
      .then(d => d.meals[0]) // grab the first (only) meal from the array
  );

  try {
    const meals = await Promise.all(promises); // wait for all 20 fetches to complete
    container.innerHTML = ""; // clear the skeletons
    meals.forEach((meal, i) => {
    container.appendChild(createCard(meal, i * 40)); // add each card with a staggered delay
    });
  } catch {
    // If any fetch fails, show an error message instead
    container.innerHTML = `
      <div class="state-msg">
        <span class="emoji">😕</span>
        Could not load recipes. Check your connection and try again.
      </div>`;
  }
}

// ── 6. COUNTRY RECIPES ───────────────────────────────────
// Fetches all meals for a specific country using the area filter endpoint.
// Receives strArea directly (e.g. "American") — no countryMap needed!
async function getCountryFood(country) {
  showSkeletons(10); // show placeholders while loading

  try {
    // Call the API with ?a= (area filter) to get meals from that cuisine
    const res  = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?a=${country}`);
    const data = await res.json(); // convert raw data to JS object to display
    container.innerHTML = ""; // clear the skeletons

    // If the API returns null for meals, that country has no results
    if (!data.meals) {
      container.innerHTML = `
        <div class="state-msg">
          <span class="emoji">🍽️</span>
          No dishes found for ${area}. Try another country!
        </div>`;
      return; // stop here, don't run the code below
    }

    // Loop through all returned meals and add a card for each one
    data.meals.forEach((meal, i) => {
      container.appendChild(createCard(meal, i * 35));
    });

  } catch {
    // If the fetch fails entirely, show an error
    container.innerHTML = `
      <div class="state-msg">
        <span class="emoji">⚠️</span>
        Error loading data. Please try again.
      </div>`;
  }
}

// ── 7. SEARCH ────────────────────────────────────────────
// Listen for when the user submits the form (clicks Search or presses Enter).
// e.preventDefault() stops the page from refreshing, which is default form behavior.

searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const query = searchInput.value.trim(); // get typed text and remove extra spaces
  if (query === "") return;               // if empty, do nothing
  searchMeals(query);
});

// Fetch meals from the API that match the search keyword.
// The API's search endpoint: ?s= means search by meal name.
async function searchMeals(query) {
  setSectionTitle(`Results for "${query}"`);
  showSkeletons(10); // show placeholders while loading

  try {
    const res  = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`);
    const data = await res.json();
    container.innerHTML = ""; // clear the skeletons

    // If no meals match the search, show a message
    if (!data.meals) {
      container.innerHTML = `
        <div class="state-msg">
          <span class="emoji">🔍</span>
          No results found for "${query}". Try another keyword!
        </div>`;
      return;
    }

    // Loop through results and add a card for each meal
    data.meals.forEach((meal, i) => {
      container.appendChild(createCard(meal, i * 35));
    });

  } catch {
    // If the fetch fails, show an error
    container.innerHTML = `
      <div class="state-msg">
        <span class="emoji">⚠️</span>
        Error searching. Please try again.
      </div>`;
  }
}

// ── 8. INIT ──────────────────────────────────────────────
// This runs immediately when the page loads
buildDropdown();    // fetch areas from API and build the dropdown buttons
getRandomRecipes(); // load 20 random recipes into the grid
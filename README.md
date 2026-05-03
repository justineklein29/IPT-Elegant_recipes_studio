# IPT-Elegant_recipes_studio

Recipe Finder Web App

HOW TO RUN
Open this link in your browser: https://justineklein29.github.io/IPT-Elegant_recipes_studio/
Or download the ZIP, extract it, and open index.html in your browser.

API USED
TheMealDB API - https://www.themealdb.com

https://www.themealdb.com/api/json/v1/1/

https://www.themealdb.com/api/json/v1/1/random.php

https://www.themealdb.com/api/json/v1/1/search.php?s=chicken

https://www.themealdb.com/api/json/v1/1/filter.php?a=Filipino

https://www.themealdb.com/api/json/v1/1/lookup.php?i=52772

A free public API that provides meal data like names, images, 
ingredients, instructions, and YouTube links.

The app uses it to:
- Show 20 random recipes on load
- Filter meals by country
- Search meals by name
- Show full recipe details

CHALLENGES FACED
The biggest challenge was passing data between index.html and recipe.html.
When a user clicks a meal card, I didn't know how to tell the next page 
which meal was clicked. I solved it using localStorage to save the meal ID 
and retrieve it on the recipe page.

Another challenge was the ingredients — the API stores them as 
strIngredient1, strIngredient2... up to 20, so I had to loop through 
them and filter out the empty ones.

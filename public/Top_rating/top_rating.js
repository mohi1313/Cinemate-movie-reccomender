document.addEventListener("DOMContentLoaded", () => {
  const yearInput = document.getElementById("yearInput");
  const resultDiv = document.getElementById("result");
  const searchBtn = document.querySelector("button");

  let movies = {}; // { movieId: { title, year } }
  let ratings = {}; // { movieId: [rating1, rating2, ...] }

  function fetchData() {
    return Promise.all([
      fetch("/data/movie.csv").then(res => res.text()),
      fetch("/data/rating_generated.csv").then(res => res.text())
    ]);
  }

  function parseCSV(data) {
    return data.trim().split("\n").slice(1); // remove header
  }

  function prepareData(movieText, ratingText) {
    const movieLines = parseCSV(movieText);

    movieLines.forEach(line => {
      // handle titles with commas using regex
      const parts = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
      if (!parts || parts.length < 2) return;

      const id = parts[0].trim();
      const titleRaw = parts[1].replace(/"/g, "").trim();
      const yearMatch = titleRaw.match(/\((\d{4})\)/);
      const year = yearMatch ? parseInt(yearMatch[1]) : null;

      movies[id] = { title: titleRaw, year };
    });

    const ratingLines = parseCSV(ratingText);
    ratingLines.forEach(line => {
      const [userId, movieId, rating] = line.split(",");
      if (!ratings[movieId]) ratings[movieId] = [];
      ratings[movieId].push(parseFloat(rating));
    });
  }

  function filterByYear() {
    const year = parseInt(yearInput.value.trim());
    resultDiv.innerHTML = "";

    if (isNaN(year)) {
      resultDiv.innerHTML = "❌ Please enter a valid year.";
      return;
    }

    const movieList = [];

    for (const id in movies) {
      const movie = movies[id];
      if (movie.year === year && ratings[id] && ratings[id].length > 0) {
        const avg = ratings[id].reduce((a, b) => a + b, 0) / ratings[id].length;
        movieList.push({ title: movie.title, avgRating: avg });
      }
    }

    if (movieList.length === 0) {
      resultDiv.innerHTML = `❌ No movies found for year ${year}.`;
      return;
    }

    movieList.sort((a, b) => b.avgRating - a.avgRating);

    resultDiv.innerHTML = "<h3>Top Rated Movies</h3>";
    movieList.forEach(movie => {
      const div = document.createElement("div");
      div.className = "movie-card";
      div.innerHTML = `<strong>${movie.title}</strong><br>⭐ Rating: ${movie.avgRating.toFixed(1)}`;
      resultDiv.appendChild(div);
    });
  }

  searchBtn.addEventListener("click", filterByYear);

  fetchData()
    .then(([movieText, ratingText]) => {
      prepareData(movieText, ratingText);
    })
    .catch(err => {
      console.error("❌ Error loading CSVs:", err);
      resultDiv.innerHTML = "Failed to load movie data.";
    });
});

Interactive Linear Regression (Front-end Only)
=============================================

This is a small, framework-free web app that lets students explore linear regression interactively:

- Generate a synthetic dataset with a chosen true slope/intercept and noise
- Click on the chart to add custom points
- Fit a line using Ordinary Least Squares (OLS)
- Visualize residuals and view metrics (MSE, R²)

Tech
----
- Plain HTML/CSS/JavaScript (no frameworks)
- [Chart.js](https://www.chartjs.org/) via CDN for visualization

Files
-----
- `index.html` — Main page with controls, chart canvas, and explanations
- `style.css` — Styling
- `app.js` — Logic for data generation, OLS, metrics, and rendering

Run locally
-----------
You can serve the app as static files using any simple HTTP server. If you have Python installed:

```bash
cd /workspaces/football_regression
python3 -m http.server 8000
```

Then open http://localhost:8000 in your browser and click `index.html`.

How to use
----------
1. Adjust the number of points, noise, and the true slope/intercept.
2. Click "Generate data" to create a dataset.
3. Click "Fit OLS" to compute the best-fit line.
4. Toggle residuals to visualize errors.
5. Optionally check "Click on chart to add points" and click on the plot to add more data.

Notes
-----
- OLS closed-form is used: `b1 = Σ(x-\bar{x})(y-\bar{y}) / Σ(x-\bar{x})²` and `b0 = \bar{y} - b1\bar{x}`.
- R² is computed as `1 - SSE/SST`; when all y are identical, R² is set to 1 by convention here.
# football_regression
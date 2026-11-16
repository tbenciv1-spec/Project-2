# Day-5 Flag Review Tool

A small web tool for a DSNY supervisor deciding whether to review Missed Collection requests that are still open after N days. It replays NYC 311 data (8,887 unique requests, created 2026-03-09 to 2026-05-29) so a supervisor can set the flag rule, see the daily workload against a cap, and record what a review finds for each flagged request.

Course project: MIS 581S Project 2 (Binghamton University). Not an official DSNY or City of New York tool.

## What it does
1. Set the flag rule (N = 2 to 6 days), what counts as late, and a workload cap per day.
2. See requests flagged, flagged per day, the share of flags truly late, and the share of late requests caught.
3. Compare N = 2 to 6, see the days-to-close distribution, and review flagged requests (outcome and short note).
4. Export the review log as CSV. Reviews are stored only in the browser.

## How to run
Open `index.html` in a browser (no build step, no server, no API keys). Live version: [add Vercel URL].

## Files
- `index.html`, `style.css`, `app.js`: the app.
- `data.js`: the data embedded for the page. `data.csv`: the same data as a CSV with a data dictionary below.

## Data
Source: NYC Open Data, 311 Service Requests from 2020 to Present (erm2-nwe9), agency DSNY, complaint type Missed Collection. Only request number and dates are used. No names, addresses or phone numbers.

| Variable | Type | Meaning | Example |
|---|---|---|---|
| unique_key | integer | 311 request number | 68265539 |
| created | date | day the request was created | 2026-03-09 |
| closed | date | day the request was closed | 2026-03-16 |
| days_to_close | integer | closed date minus created date, in calendar days | 7 |

## Known limits
- Every request in the file is already closed, so the tool replays what a flag would have caught; "closed" does not prove the street was collected.
- Review thresholds (scale at 60% or more, revise at 30% to under 60%, minimum 20 reviews) are assumptions, not DSNY standards.
- Results describe this dataset only (Mar 9 to May 29, 2026).
- Review notes are free text; users must not enter personal data.

## Tools
Built with an AI assistant (Claude) as a development partner; see the prompt log in the report appendix.

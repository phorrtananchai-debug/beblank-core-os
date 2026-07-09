# UI Stabilization v1 QA Report

Base URL: http://127.0.0.1:5174
Captured: 2026-07-09T18:47:43.516Z
Browser: Microsoft Edge via Playwright executablePath
Auth note: `/?edit=1` and `/os/portfolio` were captured after mock local login because editor access is protected.

| Route | Viewport | Screenshot | Status | Notes |
| --- | --- | --- | --- | --- |
| / | 1440x1100 | 01-home-desktop.png | warning | external resources blocked in QA browser: 2 |
| / | 390x844 | 02-home-mobile.png | warning | external resources blocked in QA browser: 2 |
| /?edit=1 | 1440x1100 | 03-home-edit-desktop.png | warning | external resources blocked in QA browser: 2 |
| /projects | 1440x1100 | 04-projects-desktop.png | warning | external resources blocked in QA browser: 2 |
| /portfolio/karun-central-khon-kaen | 1440x1100 | 05-portfolio-detail-desktop.png | warning | external resources blocked in QA browser: 2 |
| /os/portfolio | 1440x1100 | 06-os-portfolio-desktop.png | warning | external resources blocked in QA browser: 2 |
| /m | 390x844 | 07-mobile-os-unauth.png | warning | external resources blocked in QA browser: 2 |
| /m | 390x844 | 08-mobile-os-auth-home.png | warning | external resources blocked in QA browser: 2 |
| /m | 390x844 | 09-mobile-os-auth-calendar.png | warning | external resources blocked in QA browser: 2 |
| /m | 1440x1100 | 10-mobile-os-desktop.png | warning | external resources blocked in QA browser: 2 |
| /login | 1440x1100 | 11-login-desktop.png | warning | external resources blocked in QA browser: 2 |

## Separation Summary

- Public routes render portfolio surfaces without editor controls unless `?edit=1` is present and the local/mock session is authenticated.
- `/m` renders as a standalone mobile route without public navigation and without Control room/report copy.
- `/os/portfolio` remains inside the protected OS shell and uses the local/mock editor warning when Firebase env is absent.
- Firebase production setup is paused; QA observed local/mock behavior only.
- `/os/brain` was not opened or modified during this pass.
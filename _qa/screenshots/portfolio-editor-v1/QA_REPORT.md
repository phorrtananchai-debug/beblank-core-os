# Portfolio Editor v1 QA

Server: http://127.0.0.1:5174

| Route | Viewport | Auth | Screenshot | Status | Notes |
|---|---:|---|---|---|---|
| / | 1440x1100 | no | 01-home-public-desktop.png | pass | visual state captured |
| / | 390x844 | no | 02-home-public-mobile.png | pass | visual state captured |
| /?edit=1 | 1440x1100 | yes | 03-home-edit-mode-desktop.png | pass | editor toolbar visible |
| /?edit=1 after add image | 1440x1100 | yes | 04-home-after-add-card-desktop.png | pass | editor toolbar visible; added card title visible |
| /projects | 1440x1100 | no | 05-projects-desktop.png | pass | visual state captured |
| /portfolio/karun-central-khon-kaen | 1440x1100 | no | 06-portfolio-karun-central-khon-kaen-desktop.png | pass | visual state captured |
| /m | 390x844 | no | 07-mobile-os-unauth.png | warning | minimal landing/login structure |
| /m | 390x844 | yes | 08-mobile-os-auth.png | pass | visual state captured |
| /login | 1440x1100 | no | 09-login-desktop.png | pass | minimal landing/login structure |
| /os/portfolio | 1440x1100 | yes | 10-os-portfolio-editor-desktop.png | pass | editor toolbar visible |
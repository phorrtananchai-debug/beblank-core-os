# Firebase Rules

Starter rules for BeBlank Portfolio Editor v1. Replace `OWNER_UID` with the Google account UID that can edit the portfolio.

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    function isOwner() {
      return request.auth != null && request.auth.uid == 'OWNER_UID';
    }

    match /portfolioProjects/{projectId} {
      allow read: if true;
      allow write: if isOwner();
    }

    match /homepagePortfolioItems/{itemId} {
      allow read: if true;
      allow write: if isOwner();
    }
  }
}

service firebase.storage {
  match /b/{bucket}/o {
    function isOwner() {
      return request.auth != null && request.auth.uid == 'OWNER_UID';
    }

    match /portfolio/{allPaths=**} {
      allow read: if true;
      allow write: if isOwner()
        && request.resource.size < 10 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
    }
  }
}
```

Public reads are enabled here because the portfolio website needs published images/layout. Editing and uploads are owner-only.

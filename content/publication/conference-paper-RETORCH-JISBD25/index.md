---
title: 'RETORCH*: A Cost and Resource aware Model for E2E Testing in the Cloud'

# Authors
# If you created a profile for a user (e.g. the default `admin` user), write the username (folder name) here
# and it will be replaced with their full name and linked to their profile.
authors:
- augusto
- moranjesus
- bertolino
- claudio
- tuya
author_notes:
- "Equal contribution"
- "Equal contribution"
- "Equal contribution"
- "Equal contribution"
- "Equal contribution"
- "Equal contribution"

date: '2025-09-09T00:00:00Z'
doi: ''

# Schedule page publish date (NOT publication's date).
publishDate: '2022-09-05T00:00:00Z'

# Publication type.
# Accepts a single type but formatted as a YAML list (for Hugo requirements).
# Enter a publication type from the CSL standard.
publication_types: ['paper-conference']

# Publication name and optional abbreviated publication name.
publication: 'In *Actas de las 29th Jornadas de Ingeniería del Software y Bases de Datos, Córdoba, Spain*' 
publication_short: 'In *JISBD25*'

abstract: Moving testing to the Cloud overcomes time/resource constraints by leveraging an unlimited and elastic infrastructure, especially for testing levels like End-to-End (E2E) that require a high number of resources and/or execution time. However, it introduces new challenges to those already faced on-premises, like selecting the most suitable Cloud infrastructure and bill-ing scheme. We propose the RETORCH* test execution model that estimates and compares the monetary cost of executing an E2E test suite with different Cloud alternatives, billing schemes, and test configurations. RETORCH* goes beyond the mere cost billed, and selects the solution that best aligns with the test team strategy using the data of on-premises prior executions and the tester’s experience. This cost is broken down into the cost incurred to execute the test suite (testing cost) and possible unused infrastructure (overprovisioning cost). Based on these distinct costs, the test team can compare different Cloud and test configurations. RETORCH* has been evaluated using a real-world application's E2E test suite. We analyze how the different decisions taken when the suite is migrated to the Cloud impact the cost, highlighting how RETORCH* can help the tester during Cloud and test configuration to make a more informed decision..

# Summary. An optional shortened abstract.
summary: 

tags: 
 - Software engineering
 - Test optimization
 - Software testing
 - Cloud computing
 - End-to-end testing
 - E2E testing

# Display this page in the Featured widget?
featured: false

# Custom links (uncomment lines below)
# links:
# - name: Custom Link
#   url: http://example.org

url_pdf: 'https://digibuo.uniovi.es/dspace/bitstream/handle/10651/80780/11705-JISBD-2025-14.pdf?sequence=4&isAllowed=y'
url_code: ''
url_dataset: ''
url_poster: ''
url_project: ''
url_slides: 'https://digibuo.uniovi.es/dspace/bitstream/handle/10651/80780/2025_JISBD_AugustoRETORCHStarPresentation.pdf?sequence=1&isAllowed=y'
url_source: ''
url_video: ''

# Featured image
# To use, add an image named `featured.jpg/png` to your page's folder.
#image:
#  caption: 'Image credit: [**Unsplash**](https://unsplash.com/photos/pLCdAaMFLTE)'
#  focal_point: ''
#  preview_only: false

# Associated Projects (optional).
#   Associate this publication with one or more of your projects.
#   Simply enter your project's folder or file name without extension.
#   E.g. `internal-project` references `content/project/internal-project/index.md`.
#   Otherwise, set `projects: []`.
projects:
  - equavel

# Slides (optional).
#   Associate this publication with Markdown slides.
#   Simply enter your slide deck's filename without extension.
#   E.g. `slides: "example"` references `content/slides/example/index.md`.
#   Otherwise, set `slides: ""`.
#slides: ""
---



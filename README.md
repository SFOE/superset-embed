# [Repository Title]

<!-- Replace the title above with your project name -->

> 📖 **Before using this template**, read the [Repository Governance Guide](https://github.com/SFOE/bfe-dm-000-documentation/blob/main/en/annexes/DI.04.A2-DM-GIT_repo_governance.md) — it contains the rules and conventions you must follow for naming, badges, git practices, credential security, and AI-assisted development.

<!-- Badges row — update the placeholder values with your project's metadata -->
![Repo Owner](https://img.shields.io/badge/Repo_Owner-Team%20Name-blue)
![Repo Custodian](https://img.shields.io/badge/Repo_Custodian-Team%20Name-blue)
![Section](https://img.shields.io/badge/Section-EE-lightgrey)
![Status](https://img.shields.io/badge/Status-in--development-yellow)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

<!-- Badge instructions:
  - Repo Owner:
    - PRIVATE repos: use the person's name (e.g., "Jean%20Dupont")
    - PUBLIC repos: use the section name of the repo-owner (e.g., "Energy%20Efficiency")
  - Repo Custodian:
    - PRIVATE repos: use the person's name
    - PUBLIC repos: use the section name of the repo-custodian (often the same as owner, but not mandatory)
  - Section: Replace "EE" with your section abbreviation in UPPERCASE (official abbreviation from SFOE organigramme)
  - Status: Change "in--development" to one of: operational, in--development, archived, deprecated
    Note: A literal hyphen in Shields.io requires double-dash (e.g., "in--development")
  - Status colors: operational = brightgreen, in-development = yellow, archived = lightgrey, deprecated = red
  - Spaces in badge values: use %20 (e.g., "Energy%20Efficiency")
-->

## Description / Purpose

<!-- Replace this section with a clear description of what this repository does. -->

[Describe the purpose of this repository: what problem it solves, what calculations or automations it performs, and who uses the results for which goals.]

> **Note:** When the status badge is set to "operational", provide a clear definition of the code's purpose (e.g., "Operational for: monthly energy production statistics calculation").

## License & Privacy

This repository is by default under the [MIT License](./LICENSE) in alignment with Swiss federal open source policy ([Art. 9 LMET](https://www.fedlex.admin.ch/eli/cc/2023/682/fr#art_9), [Em002 series](https://www.bk.admin.ch/bk/fr/home/digitale-transformation-ikt-lenkung/bundesarchitektur/open_source_software/hilfsmittel_oss.html)).

Repositories are created as **private** by default. Making a repository public requires approval from an SFOE organization owner.

The determination of the appropriate license is the **responsibility of the repository owner**. The MIT license is provided as a default. Consult the [Em002-3 Guide Licences OSS](https://www.bk.admin.ch/dam/bk/fr/bilder/dti/bundesarchitektur/OSSHilfsmittel/em002-3leitfadenosslizenzen.pdf.download.pdf/Em002-3%20Guide%20Licences%20OSS.pdf) for guidance on license selection.

## SFOE-Data Management References

- [SFOE-DM: Digital governance directives](https://intranet.collab.admin.ch/uvek/bfe/de-ch/Organisation/Datenmanagement/Richtlinien-Datenmanagement/Seiten/default.aspx)

> **Note:** This link points to SFOE intranet resources and is accessible only to SFOE staff.

## Installation & Setup

```bash
pip install pre-commit
pre-commit install
```

See the [Repository Governance Guide](https://github.com/SFOE/bfe-dm-000-documentation/blob/main/en/annexes/DI.04.A2-DM-GIT_repo_governance.md) for detailed setup and usage instructions.

## Usage

<!-- Replace this section with instructions on how to run your scripts. -->

[Describe how to run your scripts here. Include any required input data, expected output, and example commands.]

## Folder Structure

```
├── src/          ← Source code (Python scripts, R scripts)
├── data/         ← Input data (gitignored by default)
├── output/       ← Generated results and reports (gitignored)
├── docs/         ← Project documentation
├── tests/        ← Test files (pytest, testthat)
├── .github/      ← GitHub configuration (PR template, Dependabot, CODEOWNERS)
├── METADATA.yaml ← Machine-readable repository metadata
├── LICENSE       ← MIT license (default)
├── .gitignore    ← Security-oriented file exclusion patterns
└── .pre-commit-config.yaml ← Pre-commit hook configuration
```

### src/

Place Python scripts (`.py`) or R scripts (`.R`, `.Rmd`) here. For larger projects, consider sub-folders: `src/data_processing/`, `src/calculations/`, `src/reporting/`.

### data/

Input data files. This directory is **gitignored by default** — files placed here will not be pushed to the remote. Do not commit sensitive or personal data. To track a specific small reference file, add a negation pattern in `.gitignore`: `!data/reference_values.csv`

### output/

Generated results, reports, and output files. **Gitignored by default.** Output should be reproducible from the source code and input data — do not commit output files.

### tests/

Test files. For Python use `pytest` (`pip install pytest`, run with `pytest tests/`). For R use `testthat`. Even small scripts benefit from a few tests on core calculation functions.

### docs/

Project documentation beyond this README. Suggested additions: `data_sources.md`, `methodology.md`, `changelog.md`.

> **Note:** This folder structure is a recommendation. The repository owner is free to adapt it to their project's needs.

## Contact

<!-- Replace with the generic email address of the repo-owner's section,
     or the generic SFOE contact address if no section-specific address exists. -->

- **Contact:** [section-email@bfe.admin.ch]

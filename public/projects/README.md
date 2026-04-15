# Adding a New Hardware Project

## 1. Create a folder
Create a new folder here: `public/projects/<project-name>/`

## 2. Add your files
Put these files in the folder:
- `config.json` — project metadata (required)
- `*.glb` — 3D PCB model from KiCAD (compressed via gltf.report)
- `*.png` / `*.jpg` — PCB renders, layout screenshots
- `*.pdf` — schematic PDF

## 3. Run the generator
```bash
node scripts/generate-projects.js
```

This scans all project folders and updates `src/data/projectsData.js` automatically.

## config.json template
```json
{
  "title_en": "My Project Name",
  "title_it": "Nome Progetto",
  "company": "Company Name",
  "role_en": "Your Role",
  "role_it": "Tuo Ruolo",
  "period": "Jan 2025 - Present",
  "description_en": "What this project does...",
  "description_it": "Cosa fa questo progetto...",
  "tags": ["KiCAD", "PCB Design", "STM32"],
  "category": "hardware",
  "badge": "Hardware + PCB",
  "badgeColor": "amber",
  "highlights_en": [
    "Highlight 1",
    "Highlight 2"
  ],
  "highlights_it": [
    "Punto chiave 1",
    "Punto chiave 2"
  ],
  "github": "https://github.com/eynmim/repo-name"
}
```

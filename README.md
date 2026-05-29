# Action: Carbone print

Generate `docx` and `pdf` files from the current NocoBase record using a self-hosted Carbone server.

## Notes

- Purpose: generate printable DOCX/PDF documents from NocoBase record data via Carbone.
- This plugin is a fork of `kresho/nocobase-print`.
- Main difference: this fork targets NocoBase `2.0.59`.
- Limitation: it currently works only with Form `v1`.

Set `CARBONE_BASE` for the NocoBase application container, for example:

```bash
CARBONE_BASE=http://carbone:4000/
```

Templates are uploaded through the NocoBase File Manager and selected in the action settings.

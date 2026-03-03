# Mahindra Parts Finder (UI-only)

This app is built for your shop customers:

1) Brand (currently only Mahindra)
2) Car name (fixed list you provided)
3) Category (Suspension/Brake/Light/etc.)
4) Output: Product Name + O.E. No. with Copy + WhatsApp buttons

## How to run

```bash
npm install
npm run dev
```

Open: http://localhost:5173

## Excel database

The app reads: `public/data.xlsx`

Columns supported (any one works):
- Product Name / Product / Item / Description
- O.E. No. / OE / OE No / Part No / PartNo
- Vehicle / Car / Model

If your Excel uses different column names, tell me and I will adjust.

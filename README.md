<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1ekmGXA8x28LJ-L_QhBNEYNVagtORcOkT

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Vente en gros (wholesale module)

Menu **Vente en gros**: B2B sales of cleaning products.

- **Vue d'ensemble**: invoiced revenue and margin of the month, amounts to collect, overdue invoices, best sellers, products to restock.
- **Commandes**: quote → confirmed (stock out) → prepared → delivered → invoiced (`FAC-G-YYYY-NNNN`) → paid. Cancelling a confirmed order puts the stock back. Prints the devis, bon de livraison and facture (Imprimer / PDF).
- **Catalogue**: products with price tiers by quantity, purchase price, margin and stock alerts.
- **Clients pro**: SIRET, VAT number, negotiated discount and payment terms (max. 60 days).
- **Réglages**: franco de port, delivery fee, minimum order, minimum margin, company details printed on documents, JSON backup / restore.

Prices and totals come from `services/wholesalePricing.ts`, covered by `npm test`.
Data is stored in the browser (`localStorage`) until the app gets a backend: export a backup regularly.

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

Menu **Vente en gros**: buying and selling cleaning products to professionals.

- **Vue d'ensemble**: invoiced revenue and margin of the month, amounts to collect, open orders, quotes, stock value, amounts owed to suppliers, overdue invoices, best sellers, products to restock.
- **Ventes**: quote → confirmed (stock out, cost of goods frozen at the CMP of the day) → prepared → delivered → invoiced (`FAC-G-YYYY-NNNN`) → paid. Cancelling a confirmed order puts the stock back. Prints the devis, bon de livraison and facture.
- **Clients**: SIRET, VAT number, negotiated discount and payment terms (max. 60 days).
- **Achats**: supplier purchase orders (`ACH-YYYY-NNNN`), partial or full reception, supplier shipping spread into the landed cost, supplier invoice, due date and payment. Prints the supplier order form.
- **Fournisseurs**: lead time, payment terms, purchases received, amount to pay.
- **Stock**: available / to deliver / physical / incoming quantities, value at weighted average cost (CMP), inventory counts, losses, adjustments, full movement journal and reorder suggestions that become draft purchase orders.
- **Catalogue**: products with price tiers by quantity, main supplier, CMP and last purchase price, margin and stock alerts.
- **Rentabilité**: sales, cost of goods, gross margin by product or customer for a period, purchases received, losses and inventory gaps.
- **Réglages**: franco de port, delivery fee, minimum order, minimum margin, company details printed on documents, JSON backup / restore.

The business rules live in `services/wholesalePricing.ts` (sales) and `services/wholesaleStock.ts` (purchases, stock, cost), covered by `npm test`. `npx tsc --noEmit` type-checks the project.
Data is stored in the browser (`localStorage`) until the app gets a backend: export a backup regularly.

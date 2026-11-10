---
name: importacao-brasil-franca
description: Analisa a viabilidade de importar um produto do Brasil para vender na França. Cobre a tarifa sob o acordo UE-Mercosul, a regulamentação por categoria (alimentos, cosmética, EUDR, biodiversidade, álcool, têxteis), o custo de importação (landed cost) e a margem, e indica as regiões e feiras onde vender. Use quando o usuário perguntar "vale a pena importar X", "quanto custa trazer X do Brasil", "quais documentos preciso", "qual a tarifa", "como importar café/cacau/cosméticos/pedras", "custo de importação", "landed cost", "EUDR", "acordo Mercosul" ou quiser comparar produtos para importar.
---

# Importação Brasil → França: análise de produto

Objetivo: dizer ao usuário, com números e passos concretos, se um produto brasileiro tem potencial **no mercado francês em geral** (consumidores e empresas francesas, não só a comunidade brasileira) e o que é preciso para importá-lo.

O usuário é brasileiro, mora em Lyon e escreve em português. Responda em português do Brasil.

## Fluxo

1. **Identificar o produto.** Pergunte só o que faltar: produto exato, forma (a granel, embalado, com marca), volume do primeiro lote, preço FOB do fornecedor (se já tiver) e se o cliente final é empresa (B2B) ou consumidor (B2C).
2. **Classificar o código tarifário.** Proponha o código NC/TARIC provável (8 dígitos) e diga que precisa ser confirmado. Mande o usuário consultar:
   - Access2Markets (Comissão Europeia): https://trade.ec.europa.eu/access-to-markets/
   - TARIC: https://ec.europa.eu/taxation_customs/dds2/taric/
   - RITA, da alfândega francesa (douane.gouv.fr), para a TVA e as regras nacionais.
3. **Tarifa sob o acordo UE-Mercosul.** O acordo comercial interino está em aplicação provisória desde **1º/05/2026**. Verifique se o produto:
   - teve a tarifa zerada logo no início (exemplos: muitas frutas, castanhas, especiarias, óleos essenciais, vinhos, produtos florestais);
   - tem redução escalonada (até 10 anos do lado europeu);
   - está sob **cota** (carne bovina, suína e de frango, açúcar, mel, etanol, arroz): em geral é desaconselhável para um importador pequeno.
   Lembre que **sem a prova de origem prevista no acordo, paga-se a tarifa cheia**. Isso é responsabilidade do exportador brasileiro.
4. **Regulamentação.** Leia `references/regulamentacao.md` e liste **apenas** o que se aplica ao produto, como um checklist com o órgão responsável e o documento exigido.
5. **Custo de importação e margem.** Rode o script:
   ```bash
   python3 .claude/skills/importacao-brasil-franca/scripts/custo_importacao.py --help
   ```
   Preencha com os números do usuário. Quando faltar um dado, use uma estimativa explícita e marque-a como **estimativa**. Mostre a tabela do resultado e o preço mínimo de venda para a margem desejada.
6. **Mercado e regiões.** Leia `references/regioes-feiras.md` e indique quem compra, em que regiões e em que feiras. Puxe a região de Lyon (Auvergne-Rhône-Alpes) quando fizer sentido.
7. **Veredito.** Feche com:
   - **Nota de potencial** (de 1 a 5) para o mercado francês em geral, com o motivo em uma linha;
   - os **3 maiores riscos**;
   - **próximos passos** em ordem, começando pelo lote teste.

## Formato da resposta

- Comece pelo veredito em 2 ou 3 linhas e depois detalhe.
- Use tabelas para a tarifa, o checklist regulatório e o custo de importação.
- Separe com clareza o que é **fato verificado** do que é **estimativa**.
- Regras e prazos (EUDR, cotas, tarifas) mudam: sempre que possível, confirme com uma busca na web e cite a fonte com link.

## Princípios

- Não estimule produtos que competem com o agricultor francês (carne, frango, açúcar). Têm cota, regras sanitárias pesadas e são politicamente sensíveis na França.
- Prefira produtos que a França **não produz, mas já consome e valoriza**: café especial, cacau fino, fava tonka, ingredientes para cosmética, castanhas, pedras e minerais, cachaça premium.
- Para começar, o mais seguro é um lote teste pequeno, vendido para empresas (B2B) antes de lançar para o consumidor.

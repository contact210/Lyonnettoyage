---
name: expliquer-courrier
description: 'Explica em português uma carta, e-mail, notificação ou formulário administrativo francês (CAF, MDPH/MDMPH, CPAM/ameli, mutuelle, prévoyance, impôts, préfecture/ANEF, mairie, école, collège, Pronote) e extrai o que fazer, até quando e com quais documentos. Use quando o usuário mandar foto, PDF ou texto de um documento e perguntar "o que é isso", "o que eles querem", "explica", "recebi uma carta", ou quando aparecer notification, décision, indu, trop-perçu, relance, mise en demeure, convocation, pièces justificatives.'
---

# Explicar um documento administrativo

## Passos
1. **Identificar** :
   - o emissor ;
   - o tipo : information, demande de pièces, décision (accord ou refus), indu (valor pago a mais), relance, mise en demeure, convocation ;
   - a data do documento.

   Não copiar números sensíveis (NIR, número allocataire) para arquivos do repositório.
2. **Resumo em 3 linhas**, em português simples. Começar com **⚠️ URGENTE** se houver :
   - mise en demeure ;
   - commissaire de justice (huissier) ;
   - suspensão de pagamento ;
   - prazo de menos de 8 dias.
3. **O que fazer** : tabela com Ação | Prazo | Como (online, courrier, presencial) | Documentos.
   - Calcular o prazo em data exata. Exemplo : "dans un délai de 2 mois à compter de la notification" se conta a partir do **recebimento**. Avisar quando a data de recebimento for incerta.
4. **Termos difíceis** : mini glossário FR → PT, só com os termos que aparecem no documento (ver lista abaixo).
5. **Se não responder** : o que acontece (suspensão, cobrança, perda do direito).
6. **Recurso possível**, se a decisão for desfavorável :
   - CAF ou CPAM : *Commission de recours amiable* (CRA), em **2 meses**. Para um indu, também é possível pedir uma *remise de dette* (perdão total ou parcial) ou um parcelamento.
   - MDPH : *RAPO* em **2 meses**, antes de qualquer tribunal.
   - Escola ou collège : primeiro o diálogo (professor, depois diretor ou principal), depois a DSDEN.
7. **Propor a continuação** :
   - escrever a resposta com `rediger-courrier` ;
   - criar um lembrete com `echeances-famille` ;
   - atualizar o dossier com `dossier-famille`.

## Regras
- Parte ilegível : dizer que não dá para ler, sem adivinhar.
- Não afirmar valores nem direitos que não estejam no documento.
- Tom calmo e prático. A maioria das cartas só pede um documento.

## Glossário de base (FR → PT)
| Francês | Português |
|---------|-----------|
| allocataire | beneficiário da CAF |
| indu / trop-perçu | valor recebido a mais, a devolver |
| rappel | valor atrasado a receber |
| pièce justificative | documento comprobatório |
| accusé de réception / recommandé AR | aviso de recebimento / carta registrada com AR |
| délai | prazo |
| recours | recurso, contestação |
| CDAPH | comissão da MDPH que decide os direitos |
| ticket modérateur | parte não reembolsada pela Sécu (a mutuelle cobre) |
| tiers payant | não adiantar o pagamento |
| dépassement d'honoraires | valor acima da tabela da Sécu |
| franchise / délai de carence | período sem cobertura no início ou durante o sinistro |
| quotient familial (QF) | renda familiar por "parte", usada nas tarifas |
| demi-pension | cantina no collège |
| radiation | desligamento ou cancelamento de inscrição |
| dérogation | pedido de exceção (ex. : collège fora do setor) |
| affectation | designação do collège ou do liceu |

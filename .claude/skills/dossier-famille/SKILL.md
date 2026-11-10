---
name: dossier-famille
description: 'Gerencia o dossier administrativo da família em Lyon (França) — CAF, MDPH/MDMPH, mutuelle, Assurance Maladie (CPAM/ameli), prévoyance, école, collège. Use quando o usuário falar de "dossier família", papelada, documentos da família, pedir um balanço ou as pendências, quiser atualizar os checklists ☐/☑, perguntar qual órgão cuida de quê ou quais papéis levar para um procedimento. Gatilhos: dossier famille, papelada, pendências, quais documentos, CAF, MDPH, ameli, CPAM, mutuelle, prévoyance, école, collège.'
---

# Dossier família — Lyon

## Fonte de verdade
- Com o repositório disponível: pasta `docs/admin/famille/`.
  - `README.md` : visão geral, calendário e suivi global.
  - `01-caf.md`, `02-mdph.md`, `03-mutuelle.md`, `04-assurance-maladie.md`, `05-prevoyance.md`, `06-ecole.md`, `07-college.md`.
  - `pieces-communes.md` (documentos usados em todo lugar) e `prompts.md`.
  - **Ler o arquivo do órgão antes de responder.**
- Sem o repositório: usar a tabela "Quem faz o quê" abaixo e avisar que convém conferir no site oficial.

## Regras (obrigatórias)
1. **O repositório GitHub é PÚBLICO.** Nunca gravar nele :
   - o NIR (número da Sécurité sociale), o número allocataire CAF ou o número do dossier MDPH ;
   - logins ou senhas ;
   - dados médicos (diagnóstico, laudos, certificados) ;
   - o nome completo e a data de nascimento das crianças. Usar "Enfant A / Enfant B".

   Esses dados ficam no Google Drive (pasta privada "Famille") ou num cofre digital. Se o usuário colar um desses dados, usá-lo só na conversa.
2. **Língua** : responder em português do Brasil quando o usuário escreve em português. Tudo o que vai para a administração é escrito em **francês**.
3. **Não inventar** valores de benefícios nem garantir direitos. Indicar o simulador oficial (caf.fr, mesdroitssociaux.gouv.fr, ameli.fr) e marcar "à vérifier".
4. **Ações externas** (enviar e-mail, criar evento, mexer no Drive, commit/push) : mostrar o que será feito e pedir confirmação antes. No Gmail, preferir **rascunho** a envio.
5. **Prazos** : sempre dar a data, o órgão e o que acontece se o prazo for perdido.

## Fluxo "balanço do dossier"
1. Ler o `README.md` e os arquivos 01 a 07, e listar os ☐ abertos por órgão.
2. Cruzar com o calendário do README e com a data de hoje, para achar os prazos dos próximos 60 dias.
3. Se o Google Drive estiver conectado : abrir a pasta "Famille" e comparar com `pieces-communes.md`. Procurar os documentos faltando ou vencidos :
   - titre de séjour vencido ;
   - justificatif de domicile com mais de 3 meses ;
   - attestation de quotient familial CAF com mais de 3 meses.
4. Responder em 4 blocos curtos :
   - 🔴 Urgente (menos de 30 dias) ;
   - 🟠 Este trimestre ;
   - 📄 Documentos faltando ;
   - ➡️ Próxima ação concreta.

## Atualizar o dossier
- Trocar ☐ por ☑ na linha certa.
- Acrescentar uma linha na tabela "Suivi" (date, démarche, réponse), sem dado sensível.
- Commit com a mensagem `docs(famille): …`. Pedir confirmação antes do push.

## Quem faz o quê
| Necessidade | Órgão | Arquivo |
|-------------|-------|---------|
| Allocations familiales, APL, prime d'activité, ARS (rentrée) | CAF | 01 |
| Deficiência : AEEH, PCH, AAH, CMI, AESH, RQTH | pedido na **MDPH**, pagamento pela CAF | 02 |
| Complemento de reembolso, tiers payant | mutuelle | 03 |
| Reembolsos, carte Vitale, médecin traitant, ALD 100 %, C2S, arrêt maladie | CPAM / ameli | 04 |
| Afastamento longo, invalidez, falecimento | prévoyance | 05 |
| Matrícula na escola, cantina, periscolar, QF municipal | Ville de Lyon (mairie) | 06 |
| Affectation en 6e, bourse, demi-pension, Pronote | collège / DSDEN / Métropole | 07 |

## Outras skills
- `expliquer-courrier` : explicar uma carta ou um e-mail recebido.
- `rediger-courrier` : escrever uma carta ou um e-mail em francês.
- `echeances-famille` : colocar os prazos no Google Agenda.
- `scolarite-lyon` : tudo sobre école e collège.

---
name: echeances-famille
description: 'Transforma os prazos administrativos e escolares da família em lembretes no Google Agenda e mantém o calendário do dossier atualizado. Use quando o usuário disser "me lembra", "coloca na agenda", "quais são os prazos", "não quero perder a data", ou logo depois de explicar uma carta que tem prazo. Cobre: renovação do titre de séjour, renovação dos direitos MDPH, bourse de collège, inscrições escolares, cantina e periscolar, affectation en 6e, déclaration de revenus, declarações trimestrais da CAF, data de aniversário dos contratos de mutuelle e prévoyance, assurance scolaire, recursos com prazo de 2 meses.'
---

# Prazos e lembretes da família

## Passos
1. Montar a lista : evento | data limite | órgão | ação | documentos.
2. **Mostrar a lista ao usuário e pedir confirmação** antes de criar qualquer evento.
3. Antes de criar, procurar na agenda um evento com o mesmo título, para evitar duplicatas.
4. Para cada prazo, criar um evento **no dia da data limite** :
   - fuso `Europe/Paris`, dia inteiro ;
   - título : `⏰ [Organisme] — [Action] (date limite)` ;
   - descrição : o que fazer, documentos, link oficial. **Nunca** números sensíveis nem dados médicos ;
   - lembretes : **30 dias e 7 dias antes**. Se a ferramenta não aceitar lembretes tão antecipados, criar um segundo evento "📋 Préparer : …" na data de preparação.
5. Prazos anuais (bourse, cantina, impostos…) : criar o evento do ano corrente e avisar que as datas mudam todo ano ("vérifier les dates").
6. Se surgir um novo tipo de prazo, acrescentá-lo à tabela "Calendrier" de `docs/admin/famille/README.md`.

## Regras de cálculo
| Prazo | Quando criar o lembrete |
|-------|-------------------------|
| Renovação do **titre de séjour** (ANEF) | o pedido se faz **entre 4 e 2 meses antes** do vencimento : um evento em J-120 (abertura) e outro em J-60 (último limite) |
| Direitos **MDPH** (AEEH, PCH, CMI, AAH) | depositar a renovação **6 meses antes** do fim do direito |
| Resposta da MDPH | **4 meses** após o depósito → relançar se não houver resposta |
| Recurso CRA (CAF, CPAM) / RAPO (MDPH) | **2 meses** a partir do recebimento da decisão |
| Bourse de collège | da rentrée até **15 de outubro** (data 2026, a confirmar a cada ano) |
| Préinscription na école (Lyon) | campanha **fevereiro → abril** (em 2026 : de 2/2 a 24/4) |
| Cantina + periscolar + mercredis (Lyon) | **abril → junho** (em 2026 : de 21/4 a 21/6), a refazer todo ano |
| Affectation en 6e (ano de CM2) | **abril → maio** |
| Inscrição no collège | fim de junho / início de julho |
| Déclaration de revenus | abril → junho (data conforme o departamento) |
| Declaração trimestral CAF (prime d'activité, RSA, AAH) | a cada 3 meses : perguntar o mês de referência ao usuário |
| Mutuelle / prévoyance | data de aniversário do contrato : revisar garantias e beneficiários |
| Assurance scolaire | setembro, todo ano |

## Formato da resposta
Tabela final : Evento | Data | Lembretes | Criado ✅ / A criar ☐.

# Dossier Famille — CAF · MDPH · Mutuelle · Assurance Maladie · Prévoyance · École · Collège

Le dossier Famille réunit les organismes et la scolarité. Chacun a sa fiche : rôle, droits possibles, pièces à fournir (☐ / ☑), démarches et points de vigilance.

**Assistants Claude** : 5 skills dans [`.claude/skills/`](../../../.claude/skills/) et des prompts prêts à copier dans [prompts.md](prompts.md).

> ⚠️ **Ce dépôt GitHub est PUBLIC.** Ne jamais écrire ici :
> numéro de sécurité sociale (NIR), numéro allocataire CAF, numéro de dossier MDPH,
> identifiants / mots de passe, ni aucune information médicale (diagnostic, certificat, compte rendu).
> Ces données vont dans un coffre-fort numérique (Digiposte, coffre de la banque…) ou dans un dossier local chiffré.
> Une autre solution : passer le dépôt en **privé** (GitHub → Settings → Danger Zone → Change visibility).

## Vue d'ensemble

| Organisme | Fiche | À quoi il sert | Contact Lyon | Espace en ligne |
|-----------|-------|----------------|--------------|-----------------|
| **CAF du Rhône** | [01-caf.md](01-caf.md) | Allocations familiales, logement, prime d'activité. Paie aussi l'AEEH et l'AAH décidées par la MDPH | 3230 · 67 bd Vivier-Merle, 69409 Lyon Cedex 03 | caf.fr → « Mon Compte » |
| **MDPH** (à Lyon : **MDMPH**) | [02-mdph.md](02-mdph.md) | Reconnaissance du handicap, AEEH, PCH, AAH, CMI, RQTH, aide à la scolarité (AESH) | Accueil : 8 rue Jonas Salk, 69007 Lyon | grandlyon.com (rubrique handicap) |
| **Mutuelle** | [03-mutuelle.md](03-mutuelle.md) | Complète les remboursements de la Sécu | selon contrat | espace adhérent de la mutuelle |
| **Assurance Maladie** (CPAM du Rhône) | [04-assurance-maladie.md](04-assurance-maladie.md) | Remboursements de soins, carte Vitale, ALD 100 %, arrêts maladie, C2S | 3646 · 69907 Lyon Cedex 20 | ameli.fr → « Mon compte » |
| **Prévoyance** | [05-prevoyance.md](05-prevoyance.md) | Protège la famille en cas d'arrêt long, d'invalidité ou de décès | selon contrat | espace client de l'assureur |
| **École** (maternelle, élémentaire) | [06-ecole.md](06-ecole.md) | Préinscription en mairie, cantine, périscolaire, quotient familial municipal, PAI / PAP / PPS, UPE2A | mairie d'arrondissement | lyon.fr |
| **Collège** (6e → 3e) | [07-college.md](07-college.md) | Affectation en 6e, bourse, demi-pension (Métropole), Pronote, orientation | collège de secteur / DSDEN du Rhône | EduConnect, Pronote |

Pièces demandées par presque tous ces organismes : [pieces-communes.md](pieces-communes.md).

## Comment les organismes se relaient

```
            MDPH (décide)                       Assurance Maladie (rembourse la base)
               │                                         │
     AEEH / AAH ▼ (accordées)                            ▼ télétransmission NOÉMIE
            CAF (paie)                          Mutuelle (rembourse le complément)

  Arrêt de travail long / invalidité / décès :
     Assurance Maladie (indemnités journalières, pension d'invalidité)
        └─► Prévoyance (complément de revenu, capital, rente éducation)
```

- **Enfant handicapé** : la demande se dépose à la **MDPH**. Elle décide de l'AEEH, et c'est la **CAF** qui la verse. La CPAM peut aussi prendre la maladie en charge à 100 % (ALD), et certaines mutuelles remboursent des séances que la Sécu ne prend pas en charge.
- **Hospitalisation ou soins coûteux** : la CPAM rembourse la part de base, la mutuelle complète. Vérifier que la télétransmission CPAM → mutuelle est active.
- **Arrêt de travail** : la CPAM verse des indemnités journalières (s'il y a des cotisations sur salaire), et la prévoyance complète.

## Calendrier des démarches

| Quand | Quoi | Organisme |
|-------|------|-----------|
| Dans le mois du changement | Signaler naissance, déménagement, mariage/séparation, changement de revenus | CAF + CPAM + mutuelle |
| Chaque trimestre | Déclaration trimestrielle (si prime d'activité / RSA / AAH) | CAF |
| Février–avril | Préinscription à l'école (1re maternelle, CP) pour la rentrée suivante | Mairie d'arrondissement |
| Avril–mai (année de CM2) | Dossier d'affectation en 6e, dérogation éventuelle | École / DSDEN |
| Avril–juin | Inscription cantine + périscolaire + mercredis (**à refaire chaque année**) | Ville de Lyon |
| Avril–juin | Déclaration de revenus aux impôts, **même sans revenus**. La CAF, la CPAM et la bourse de collège s'en servent | impots.gouv.fr |
| Fin juin – début juillet | Inscription au collège après la notification d'affectation | Collège |
| Août | Allocation de rentrée scolaire (versement automatique si droits ouverts) | CAF |
| Rentrée → **15 octobre** | Demande de **bourse de collège** (refusée si hors délai) | Scolarité Services |
| Septembre | Assurance scolaire, attestation de quotient familial pour la demi-pension | École / collège |
| **6 mois avant** la fin d'un droit MDPH | Déposer le renouvellement (AEEH, PCH, CMI, AAH…) | MDPH |
| 2 à 4 mois avant la fin d'un titre de séjour | Demander le renouvellement sur ANEF. Un titre expiré bloque les droits CAF | Préfecture / ANEF |
| Date anniversaire du contrat | Revoir les garanties et les bénéficiaires | Mutuelle + prévoyance |

## Suivi global

| # | Action | Statut |
|---|--------|--------|
| 1 | Compte caf.fr créé et à jour (composition du foyer, RIB) | ☐ |
| 2 | Compte ameli.fr créé pour chaque adulte, enfants rattachés | ☐ |
| 3 | Médecin traitant déclaré pour chaque membre de la famille | ☐ |
| 4 | Mutuelle : carte de tiers payant à jour + télétransmission NOÉMIE active | ☐ |
| 5 | Dossier MDPH déposé / droits en cours (dates d'échéance notées hors dépôt) | ☐ |
| 6 | Contrat de prévoyance en place, clause bénéficiaire à jour | ☐ |
| 7 | Pièces communes scannées dans le coffre-fort numérique | ☐ |
| 8 | Quotient familial municipal calculé (Ville de Lyon) | ☐ |
| 9 | Comptes EduConnect + Pronote créés pour chaque parent | ☐ |
| 10 | Assurance scolaire de l'année pour chaque enfant | ☐ |

> Les coordonnées viennent d'annuaires officiels et de documents de la Métropole. Elles peuvent changer : vérifier sur caf.fr, ameli.fr et grandlyon.com avant de se déplacer.

# Dossier — Droit de stationnement résident (Ville de Lyon)

Demande pour le véhicule de fonction **Volkswagen Caddy GS-260-CE** (LOA Volkswagen Bank, carte grise au nom de BRESIL NETTOYAGE = ancienne dénomination de LYON MÉNAGE PRO, SIREN 922 089 511).

**Première demande : uniquement en Mairie du 6e arrondissement** (renouvellement possible en ligne via Grand Lyon Connect). Tarif : 40 €/an, un seul droit par ménage.

Vérifier l'éligibilité de l'adresse : https://cartes.lyon.fr/stationnement-resident-voirie/

## Pièces à présenter

| # | Pièce | Statut |
|---|-------|--------|
| 1 | Carte grise **originale** GS-260-CE (+ copie) | ☐ |
| 2 | Attestation de l'employeur (`Attestation_vehicule_de_fonction_LMP.pdf`), signée et tamponnée | ☐ |
| 3 | Avis de situation SIRENE / extrait Kbis récent prouvant Bresil Nettoyage → Lyon Ménage Pro (même SIREN) | ☐ |
| 4 | Attestation d'assurance mentionnant H. Antunes Siqueira comme conducteur (optionnel, recommandé) | ☐ |
| 5 | Avis d'imposition 2026 (revenus 2025), pages 1 et 2, à l'adresse 67 rue Garibaldi — sinon contrat de bail | ☐ |
| 6 | Justificatif de domicile **de moins de 3 mois** (facture / attestation TotalEnergies récente — celle du 05/06/2026 est périmée) | ☐ |
| 7 | Certificat Crit'Air (Caddy diesel 2023 = Crit'Air 2) | ☐ |
| 8 | Pièce d'identité + titre de séjour | ☐ |

## Après validation
Paiement des 40 € en ligne sur https://stationnement.lyon.fr/paiementvignettes après réception des identifiants, ou en boutique LPA (2 place des Cordeliers, Lyon 2e, lun–ven 10h–18h).

Source : https://www.lyon.fr/demarche/stationnement/obtenir-un-droit-de-stationnement-residentiel

## Régénérer l'attestation
```
pip install reportlab pypdf
python3 generer_attestation.py
```
(modifier la date dans le script avant de régénérer)

from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import mm
out="Attestation_vehicule_de_fonction_LMP.pdf"
doc = SimpleDocTemplate(out, pagesize=A4, leftMargin=20*mm, rightMargin=20*mm, topMargin=12*mm, bottomMargin=10*mm)
ss = getSampleStyleSheet()
N = ParagraphStyle('n', parent=ss['Normal'], fontName='Helvetica', fontSize=9.6, leading=12.6, alignment=4)
NL = ParagraphStyle('nl', parent=N, alignment=0)
H = ParagraphStyle('h', parent=N, fontName='Helvetica-Bold', fontSize=14, alignment=1, leading=18)
H2 = ParagraphStyle('h2', parent=H, fontSize=11.5, fontName='Helvetica')
Hd = ParagraphStyle('hd', parent=N, fontSize=9.5, leading=12.5, alignment=0)
Hd_b = ParagraphStyle('hdb', parent=Hd, fontName='Helvetica-Bold', fontSize=13)
Small = ParagraphStyle('sm', parent=N, fontSize=8.5, leading=11, textColor=colors.HexColor('#444444'))
def tbl(rows):
    t = Table([[Paragraph(f"<b>{a}</b>", NL), Paragraph(b, NL)] for a,b in rows], colWidths=[48*mm, 102*mm])
    t.setStyle(TableStyle([('GRID',(0,0),(-1,-1),0.5,colors.grey),('BACKGROUND',(0,0),(0,-1),colors.HexColor('#EEEEEE')),
        ('VALIGN',(0,0),(-1,-1),'MIDDLE'),('TOPPADDING',(0,0),(-1,-1),2.5),('BOTTOMPADDING',(0,0),(-1,-1),2.5)]))
    t.hAlign='LEFT'; return t
s = [Paragraph("LYON MÉNAGE PRO", Hd_b),
     Paragraph("SASU – SIREN 922 089 511 – SIRET 922 089 511 00021", Hd),
     Paragraph("Siège social : 127 rue de Sèze, 69006 Lyon", Hd),
     Paragraph("contact@lyon-menage-pro.fr – 06 51 17 62 41", Hd),
     Spacer(1, 8*mm),
     Paragraph("ATTESTATION DE MISE À DISPOSITION<br/>D'UN VÉHICULE DE FONCTION", H),
     Paragraph("établie par l'employeur", H2),
     Spacer(1, 5*mm),
     Paragraph("Je soussigné, <b>Monsieur Hernandes ANTUNES SIQUEIRA</b>, agissant en qualité de Président et représentant légal de la société <b>LYON MÉNAGE PRO</b>, société par actions simplifiée unipersonnelle immatriculée au RCS de Lyon sous le numéro 922 089 511, dont le siège social est situé 127 rue de Sèze, 69006 Lyon,", N),
     Spacer(1, 2*mm),
     Paragraph("<b>précise</b> que la société était anciennement dénommée <b>BRESIL NETTOYAGE</b> et avait son siège social au 302 rue Garibaldi, 69007 Lyon ; cette dénomination et cette adresse sont celles qui figurent au certificat d'immatriculation du véhicule désigné ci-dessous (rubrique C.3), la société étant restée la même personne morale (même numéro SIREN).", N),
     Spacer(1, 2*mm),
     Paragraph("<b>atteste par la présente</b> que le véhicule ci-dessous, pris en location avec option d'achat auprès de Volkswagen Bank GmbH (rubrique C.1 du certificat d'immatriculation), est mis à la disposition permanente de :", N),
     Spacer(1, 2*mm),
     tbl([("Nom", "ANTUNES SIQUEIRA"), ("Prénom", "Hernandes"),
          ("Adresse", "67 rue Garibaldi, 1<super>er</super> étage<br/>69006 Lyon"),
          ("Qualité", "Président de la société")]),
     Spacer(1, 3*mm),
     Paragraph("<b>Véhicule concerné</b>", NL), Spacer(1, 1.5*mm),
     tbl([("Marque", "Volkswagen"), ("Modèle", "Caddy"), ("Immatriculation (A)", "GS-260-CE"),
          ("Numéro VIN (E)", "WV2ZZZSK4PX050645"), ("Date de 1<super>re</super> immatriculation (B)", "30/10/2023")]),
     Spacer(1, 3*mm),
     Paragraph("Ce véhicule constitue un <b>véhicule de fonction</b> : il est mis à disposition de manière permanente et son usage est autorisé <b>à titre personnel et privé</b>, en dehors du temps de travail, y compris les week-ends et les congés, sans restriction d'usage. Cet avantage en nature est déclaré conformément aux dispositions de l'article L. 242-1 du Code de la sécurité sociale et de l'arrêté du 10 décembre 2002.", N),
     Spacer(1, 2*mm),
     Paragraph("Le titulaire du véhicule est seul responsable des infractions au Code de la route commises lors de son usage, conformément à l'article L. 121-6 du Code de la route.", N),
     Spacer(1, 2*mm),
     Paragraph("Je certifie l'exactitude des renseignements ci-dessus. Je suis informé qu'une fausse attestation m'expose aux sanctions prévues à l'article 441-7 du Code pénal.", N),
     Spacer(1, 2*mm),
     Paragraph("La présente attestation est délivrée à l'intéressé pour servir et valoir ce que de droit.", N),
     Spacer(1, 3*mm),
     Paragraph("Fait à Lyon, le 10 novembre 2026", NL),
     Spacer(1, 3*mm),
     Paragraph("Signature et cachet de l'employeur :", NL),
     Spacer(1, 9*mm),
     Paragraph("<b>Hernandes ANTUNES SIQUEIRA</b><br/>Président – LYON MÉNAGE PRO", NL),
     Spacer(1, 3*mm),
     Paragraph("Pièces jointes : copie du certificat d'immatriculation GS-260-CE ; avis de situation SIRENE / extrait Kbis justifiant le changement de dénomination et de siège.", Small)]
doc.build(s)
from pypdf import PdfReader; print(len(PdfReader(out).pages))

#!/usr/bin/env python3
"""Calcula o custo de importação (landed cost) Brasil -> França e o preço de venda.

Todos os valores de custo local são em EUR. O valor FOB pode estar em BRL, USD ou EUR.

Lógica (simplificada; confirme sempre com o despachante):
  valor aduaneiro (CIF) = FOB + frete internacional + seguro
  imposto de importação = tarifa% x CIF
  custo sem TVA         = CIF + imposto + accises + custo do câmbio + custos locais
  TVA de importação     = tva% x (CIF + imposto + accises + custos locais até o destino)
                          -> autoliquidada na França: neutra para empresa com número de TVA,
                             não entra no custo.
  preço de venda s/ TVA = custo / (1 - margem%)   (margem calculada sobre o preço de venda)

Exemplo:
  python3 custo_importacao.py --fob 9000 --moeda USD --cambio 1.10 --frete 1800 \
      --tarifa 0 --tva 5.5 --despachante 350 --porto 400 --frete-interno 600 \
      --unidades 1200 --margem 45
"""

from __future__ import annotations

import argparse
import json
import sys


def calcular(a: argparse.Namespace) -> dict:
    if a.moeda == "EUR":
        cambio = 1.0
    else:
        if not a.cambio or a.cambio <= 0:
            raise SystemExit(f"Informe --cambio (quantos {a.moeda} valem 1 EUR).")
        cambio = a.cambio

    fob_eur = a.fob / cambio
    custo_cambio = fob_eur * a.spread_cambio / 100
    seguro = a.seguro if a.seguro is not None else (fob_eur + a.frete) * a.seguro_pct / 100
    cif = fob_eur + a.frete + seguro
    imposto = cif * a.tarifa / 100
    custos_locais = a.despachante + a.porto + a.frete_interno + a.armazenagem + a.outros
    custo_total = cif + imposto + a.accises + custo_cambio + custos_locais
    base_tva = cif + imposto + a.accises + custos_locais
    tva_importacao = base_tva * a.tva / 100

    if not 0 <= a.margem < 100:
        raise SystemExit("--margem precisa estar entre 0 e 99.")
    preco_venda_ht = custo_total / (1 - a.margem / 100)
    lucro_bruto = preco_venda_ht - custo_total

    r = {
        "fob_eur": fob_eur,
        "frete_internacional": a.frete,
        "seguro": seguro,
        "valor_aduaneiro_cif": cif,
        "imposto_importacao": imposto,
        "accises": a.accises,
        "custo_cambio": custo_cambio,
        "custos_locais": custos_locais,
        "custo_total_sem_tva": custo_total,
        "tva_importacao_autoliquidada": tva_importacao,
        "margem_pct": a.margem,
        "preco_venda_total_ht": preco_venda_ht,
        "lucro_bruto_total": lucro_bruto,
        "coeficiente_preco_sobre_custo": preco_venda_ht / custo_total if custo_total else 0,
        "peso_custos_sobre_fob_pct": (custo_total / fob_eur - 1) * 100 if fob_eur else 0,
    }
    if a.unidades:
        u = a.unidades
        r.update(
            {
                "unidades": u,
                "custo_por_unidade": custo_total / u,
                "preco_venda_unidade_ht": preco_venda_ht / u,
                "preco_venda_unidade_ttc": preco_venda_ht / u * (1 + a.tva_venda / 100),
                "tva_venda_pct": a.tva_venda,
            }
        )
    return r


def eur(v: float) -> str:
    s = f"{v:,.2f}".replace(",", " ").replace(".", ",")
    return f"{s} €"


def num(v: float, casas: int | None = None) -> str:
    s = f"{v:g}" if casas is None else f"{v:.{casas}f}"
    return s.replace(".", ",")


def imprimir_markdown(r: dict, a: argparse.Namespace) -> None:
    linhas = [
        ("FOB convertido em EUR", eur(r["fob_eur"])),
        ("Frete internacional", eur(r["frete_internacional"])),
        ("Seguro", eur(r["seguro"])),
        ("**Valor aduaneiro (CIF)**", f"**{eur(r['valor_aduaneiro_cif'])}**"),
        (f"Imposto de importação ({num(a.tarifa)}%)", eur(r["imposto_importacao"])),
        ("Accises (álcool)", eur(r["accises"])),
        (f"Custo do câmbio ({num(a.spread_cambio)}%)", eur(r["custo_cambio"])),
        ("Custos locais (despachante, porto, frete interno, armazenagem, outros)", eur(r["custos_locais"])),
        ("**Custo total sem TVA**", f"**{eur(r['custo_total_sem_tva'])}**"),
        (f"TVA de importação ({num(a.tva)}%), autoliquidada e recuperável", eur(r["tva_importacao_autoliquidada"])),
        (f"Preço de venda total s/ TVA (margem {num(a.margem)}%)", eur(r["preco_venda_total_ht"])),
        ("Lucro bruto total", eur(r["lucro_bruto_total"])),
        ("Coeficiente preço / custo", f"{num(r['coeficiente_preco_sobre_custo'], 2)}x"),
        ("Custos de importação sobre o FOB", f"+{num(r['peso_custos_sobre_fob_pct'], 1)}%"),
    ]
    if "unidades" in r:
        linhas += [
            ("Unidades", f"{num(r['unidades'])}"),
            ("**Custo por unidade**", f"**{eur(r['custo_por_unidade'])}**"),
            ("Preço de venda por unidade s/ TVA", eur(r["preco_venda_unidade_ht"])),
            (f"Preço por unidade com TVA ({num(r['tva_venda_pct'])}%)", eur(r["preco_venda_unidade_ttc"])),
        ]
    print("| Item | Valor |")
    print("|---|---|")
    for k, v in linhas:
        print(f"| {k} | {v} |")
    print()
    print("_A TVA de importação é autoliquidada na declaração de TVA (CA3): para uma empresa com "
          "número de TVA francês ela é neutra e não entra no custo. Confirme tarifa, accises e "
          "custos locais com o despachante._")


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(
        description="Custo de importação Brasil -> França e preço de venda.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    p.add_argument("--fob", type=float, required=True, help="Valor FOB total do lote, na moeda --moeda")
    p.add_argument("--moeda", choices=["BRL", "USD", "EUR"], default="USD", help="Moeda do FOB (padrão USD)")
    p.add_argument("--cambio", type=float, help="Quantos <moeda> valem 1 EUR (ex.: 1.10 para USD; 6.20 para BRL)")
    p.add_argument("--spread-cambio", type=float, default=0.0, help="Custo bancário do câmbio, em %% do FOB (padrão 0)")
    p.add_argument("--frete", type=float, default=0.0, help="Frete internacional até a UE, em EUR")
    p.add_argument("--seguro", type=float, help="Seguro em EUR (se omitido, usa --seguro-pct)")
    p.add_argument("--seguro-pct", type=float, default=0.5, help="Seguro em %% de (FOB + frete), padrão 0,5")
    p.add_argument("--tarifa", type=float, default=0.0, help="Imposto de importação em %% do CIF (com o acordo UE-Mercosul, muitas vezes 0)")
    p.add_argument("--accises", type=float, default=0.0, help="Accises e contribuições sobre álcool, em EUR (total do lote)")
    p.add_argument("--tva", type=float, default=20.0, help="Taxa de TVA de importação, em %% (20 normal; 5,5 para a maioria dos alimentos)")
    p.add_argument("--tva-venda", type=float, help="Taxa de TVA na venda (padrão: igual a --tva)")
    p.add_argument("--despachante", type=float, default=0.0, help="Honorários do despachante, em EUR")
    p.add_argument("--porto", type=float, default=0.0, help="Taxas de porto ou aeroporto (THC, manuseio, inspeção), em EUR")
    p.add_argument("--frete-interno", type=float, default=0.0, help="Transporte do porto até o armazém, em EUR")
    p.add_argument("--armazenagem", type=float, default=0.0, help="Armazenagem, em EUR")
    p.add_argument("--outros", type=float, default=0.0, help="Outros custos (laudos, rotulagem, amostras, certificações), em EUR")
    p.add_argument("--unidades", type=float, help="Número de unidades do lote (para o custo por unidade)")
    p.add_argument("--margem", type=float, default=40.0, help="Margem bruta desejada sobre o preço de venda, em %% (padrão 40)")
    p.add_argument("--json", action="store_true", help="Saída em JSON")
    a = p.parse_args(argv)
    if a.tva_venda is None:
        a.tva_venda = a.tva

    r = calcular(a)
    if a.json:
        print(json.dumps({k: round(v, 2) if isinstance(v, float) else v for k, v in r.items()},
                         ensure_ascii=False, indent=2))
    else:
        imprimir_markdown(r, a)
    return 0


if __name__ == "__main__":
    sys.exit(main())

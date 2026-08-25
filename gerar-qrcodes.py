#!/usr/bin/env python3
"""
Gera os QR codes das 12 casas do Boteco ACIA.

Uso:
    pip install qrcode pillow
    python gerar-qrcodes.py http://192.168.0.15:3311     # teste local
    python gerar-qrcodes.py https://botecoacia.com.br    # producao

O mesmo script serve para os dois casos. Muda so a URL base.
Os arquivos saem em ./qrcodes/, um PNG por casa, mais um arquivo
urls.txt com a lista para conferencia e para entregar a grafica.
"""

import sys
import os
import qrcode
from qrcode.constants import ERROR_CORRECT_H

SLUGS = [
    "garapeira-gastronomia",
    "consolinis-bistro-bar",
    "grelhadus-burger-bar",
    "braseiro-trevisan",
    "haus-bier",
    "restaurante-caravellas",
    "buck-burger",
    "to-de-boa",
    "cia-petiscaria",
    "imperio-petiscaria",
    "bar-do-fuba",
    "buteco-fnm",
]


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    base = sys.argv[1].rstrip("/")
    saida = "qrcodes"
    os.makedirs(saida, exist_ok=True)

    linhas = []
    for slug in SLUGS:
        url = f"{base}/votar/{slug}"

        qr = qrcode.QRCode(
            version=None,
            # Correcao alta: o QR continua legivel mesmo sujo, riscado ou
            # com uma logo pequena no centro. Em display de mesa de bar
            # isso nao e luxo.
            error_correction=ERROR_CORRECT_H,
            box_size=12,
            # Margem branca ao redor. Menos de 4 modulos e muitos leitores
            # simplesmente nao enxergam o codigo.
            border=4,
        )
        qr.add_data(url)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")
        caminho = os.path.join(saida, f"{slug}.png")
        img.save(caminho)

        linhas.append(f"{slug}\t{url}")
        print(f"{slug:26} {img.size[0]}px  {url}")

    with open(os.path.join(saida, "urls.txt"), "w", encoding="utf-8") as f:
        f.write("\n".join(linhas) + "\n")

    print(f"\n{len(SLUGS)} QR codes em ./{saida}/")
    print(f"Lista de URLs em ./{saida}/urls.txt")


if __name__ == "__main__":
    main()

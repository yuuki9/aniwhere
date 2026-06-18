#!/usr/bin/env python3
"""Regenerate draw.io diagrams with a left-to-right main flow layout."""

import base64
import pathlib
import zlib


def make_drawio(name: str, diagram_id: str, cells_xml: str) -> str:
    model = f"""<mxGraphModel dx="1422" dy="794" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1400" pageHeight="900" math="0" shadow="0">
  <root>
    <mxCell id="0" />
    <mxCell id="1" parent="0" />
{cells_xml}
  </root>
</mxGraphModel>"""
    compressor = zlib.compressobj(9, zlib.DEFLATED, -15)
    compressed = compressor.compress(model.encode("utf-8")) + compressor.flush()
    encoded = base64.b64encode(compressed).decode("ascii")
    return f"""<mxfile host="app.diagrams.net" modified="2026-06-17T00:00:00.000Z" agent="Cursor" version="24.7.17" type="device">
  <diagram name="{name}" id="{diagram_id}">{encoded}</diagram>
</mxfile>
"""


# Main path: Toss -> Route53 -> ALB -> EC2 x2 -> RDS/S3
# ACM sits under ALB (attachment, not traffic hop)
# External APIs branch downward
RUNTIME_CELLS = """
    <mxCell id="2" value="Apps in Toss WebView" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontStyle=1" vertex="1" parent="1">
      <mxGeometry x="40" y="120" width="170" height="60" as="geometry" />
    </mxCell>
    <mxCell id="3" value="Route 53&#xa;api.aniwhere.link" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;" vertex="1" parent="1">
      <mxGeometry x="260" y="120" width="170" height="60" as="geometry" />
    </mxCell>
    <mxCell id="4" value="ALB&#xa;HTTPS :443" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontStyle=1" vertex="1" parent="1">
      <mxGeometry x="480" y="120" width="150" height="60" as="geometry" />
    </mxCell>
    <mxCell id="5" value="ACM&#xa;*.aniwhere.link" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#e1d5e7;strokeColor=#9673a6;dashed=1;dashPattern=8 8;" vertex="1" parent="1">
      <mxGeometry x="495" y="220" width="120" height="50" as="geometry" />
    </mxCell>
    <mxCell id="6" value="EC2&#xa;Spring Boot API" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1">
      <mxGeometry x="690" y="80" width="150" height="55" as="geometry" />
    </mxCell>
    <mxCell id="7" value="EC2&#xa;Spring Boot API" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1">
      <mxGeometry x="690" y="165" width="150" height="55" as="geometry" />
    </mxCell>
    <mxCell id="8" value="RDS MySQL" style="shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;fillColor=#d5e8d4;strokeColor=#82b366;" vertex="1" parent="1">
      <mxGeometry x="910" y="70" width="120" height="70" as="geometry" />
    </mxCell>
    <mxCell id="9" value="S3&#xa;이미지 저장소" style="shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;fillColor=#d5e8d4;strokeColor=#82b366;" vertex="1" parent="1">
      <mxGeometry x="910" y="170" width="120" height="70" as="geometry" />
    </mxCell>
    <mxCell id="10" value="Naver Map" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;" vertex="1" parent="1">
      <mxGeometry x="40" y="260" width="170" height="45" as="geometry" />
    </mxCell>
    <mxCell id="11" value="Toss 로그인 API" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;" vertex="1" parent="1">
      <mxGeometry x="690" y="300" width="150" height="45" as="geometry" />
    </mxCell>
    <mxCell id="12" value="클라이언트" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontStyle=1;fontSize=13;" vertex="1" parent="1">
      <mxGeometry x="40" y="80" width="100" height="30" as="geometry" />
    </mxCell>
    <mxCell id="13" value="DNS" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontStyle=1;fontSize=13;" vertex="1" parent="1">
      <mxGeometry x="260" y="80" width="80" height="30" as="geometry" />
    </mxCell>
    <mxCell id="14" value="Public Subnet" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontStyle=1;fontSize=13;" vertex="1" parent="1">
      <mxGeometry x="480" y="80" width="120" height="30" as="geometry" />
    </mxCell>
    <mxCell id="15" value="데이터 계층" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontStyle=1;fontSize=13;" vertex="1" parent="1">
      <mxGeometry x="910" y="30" width="100" height="30" as="geometry" />
    </mxCell>
    <mxCell id="16" value="외부 API" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontStyle=1;fontSize=13;" vertex="1" parent="1">
      <mxGeometry x="40" y="230" width="100" height="30" as="geometry" />
    </mxCell>
    <mxCell id="101" value="api.aniwhere.link" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;" edge="1" parent="1" source="2" target="3">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="102" value="DNS 조회" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;" edge="1" parent="1" source="3" target="4">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="103" value="TLS 인증서 부착" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;dashed=1;dashPattern=8 8;startArrow=none;endArrow=classic;" edge="1" parent="1" source="5" target="4">
      <mxGeometry relative="1" as="geometry">
        <Array as="points">
          <mxPoint x="555" y="210" />
          <mxPoint x="555" y="190" />
        </Array>
      </mxGeometry>
    </mxCell>
    <mxCell id="104" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;" edge="1" parent="1" source="4" target="6">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="105" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;" edge="1" parent="1" source="4" target="7">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="106" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;" edge="1" parent="1" source="6" target="8">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="107" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;" edge="1" parent="1" source="7" target="8">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="108" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;" edge="1" parent="1" source="6" target="9">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="109" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;" edge="1" parent="1" source="7" target="9">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="110" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;" edge="1" parent="1" source="2" target="10">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="111" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;" edge="1" parent="1" source="6" target="11">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="112" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;" edge="1" parent="1" source="7" target="11">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>"""

DEPLOY_CELLS = """
    <mxCell id="2" value="GitHub Actions" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontStyle=1" vertex="1" parent="1">
      <mxGeometry x="80" y="180" width="170" height="60" as="geometry" />
    </mxCell>
    <mxCell id="3" value="S3&#xa;배포 아티팩트" style="shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;fillColor=#d5e8d4;strokeColor=#82b366;" vertex="1" parent="1">
      <mxGeometry x="340" y="170" width="140" height="80" as="geometry" />
    </mxCell>
    <mxCell id="4" value="EC2&#xa;SSH 배포" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1">
      <mxGeometry x="580" y="130" width="150" height="55" as="geometry" />
    </mxCell>
    <mxCell id="5" value="EC2&#xa;SSH 배포" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1">
      <mxGeometry x="580" y="230" width="150" height="55" as="geometry" />
    </mxCell>
    <mxCell id="6" value="server/**" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;" edge="1" parent="1" source="2" target="3">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="7" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;" edge="1" parent="1" source="3" target="4">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="8" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;" edge="1" parent="1" source="3" target="5">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="9" value="main merge 후 배포" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontStyle=2;fontSize=12;" vertex="1" parent="1">
      <mxGeometry x="80" y="130" width="160" height="30" as="geometry" />
    </mxCell>"""


def main() -> None:
    base = pathlib.Path(__file__).resolve().parent
    (base / "aniwhere-runtime.drawio").write_text(
        make_drawio("Runtime", "aniwhere-runtime", RUNTIME_CELLS),
        encoding="utf-8",
    )
    (base / "aniwhere-deploy.drawio").write_text(
        make_drawio("Deploy", "aniwhere-deploy", DEPLOY_CELLS),
        encoding="utf-8",
    )
    print("ok")


if __name__ == "__main__":
    main()

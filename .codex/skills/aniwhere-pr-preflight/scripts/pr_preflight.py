#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path


def run_git(args: list[str]) -> str:
    result = subprocess.run(
        ["git", *args],
        cwd=Path.cwd(),
        check=True,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    return result.stdout.strip()


ROOT = Path(run_git(["rev-parse", "--show-toplevel"]))


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8-sig", errors="replace")


def changed_files(base: str) -> list[Path]:
    outputs = [
        run_git(["diff", "--name-only", f"{base}...HEAD"]),
        run_git(["diff", "--name-only"]),
        run_git(["diff", "--name-only", "--cached"]),
        run_git(["ls-files", "--others", "--exclude-standard"]),
    ]
    files = {
        line.strip()
        for output in outputs
        for line in output.splitlines()
        if line.strip()
    }
    return [ROOT / line for line in sorted(files)]


def add_issue(issues: list[str], path: Path, message: str) -> None:
    issues.append(f"{path.relative_to(ROOT).as_posix()}: {message}")


def has_try_before(text: str, offset: int, window: int = 240) -> bool:
    return "try" in text[max(0, offset - window):offset]


def inspect_css(path: Path, text: str, issues: list[str]) -> None:
    if "currentColor" in text:
        add_issue(issues, path, "CSS 값 `currentColor`가 남아 있습니다. stylelint 설정에 맞춰 `currentcolor`를 확인하세요.")

    interactive_controls = [".map-zoom-button", ".map-list-fab"]
    for selector in interactive_controls:
        if selector in text and f"{selector}:focus-visible" not in text:
            add_issue(issues, path, f"`{selector}`에 `:focus-visible` 표시가 없습니다.")


def inspect_react(path: Path, text: str, issues: list[str]) -> None:
    hash_fallback_patterns = [
        r"href=\{[^}]*\?\?\s*['\"]#['\"]",
        r"href=['\"]#['\"]",
    ]
    for pattern in hash_fallback_patterns:
        if re.search(pattern, text):
            add_issue(issues, path, "`href=\"#\"` 또는 `?? '#'` fallback 링크가 남아 있습니다.")
            break

    for match in re.finditer(r"await\s+navigator\.(share|clipboard(?:\?|\.)?\.writeText)", text):
        if not has_try_before(text, match.start()):
            add_issue(issues, path, f"`navigator.{match.group(1)}` await 호출 주변에 try/catch가 보이지 않습니다.")


def inspect_naver_loader(path: Path, text: str, issues: list[str]) -> None:
    if "NAVER_MAP_CALLBACK_NAME" in text and "naverMapLoadPromise" in text and "WATCHDOG" not in text:
        add_issue(issues, path, "네이버 지도 SDK 로더에 콜백 미호출 대비 watchdog timeout이 보이지 않습니다.")


def inspect_shop_map(path: Path, text: str, issues: list[str]) -> None:
    if "getClusterIconSize" in text and "createMarkerIcon" in text:
        marker_icon = re.search(r"function\s+createMarkerIcon[\s\S]*?return\s+\{[\s\S]*?content:\s*`([^`]+)`", text)
        if marker_icon and "width:${size}px" not in marker_icon.group(1):
            add_issue(issues, path, "클러스터 icon size가 marker DOM width/height에 반영되는지 확인하세요.")


def inspect_file(path: Path, issues: list[str]) -> None:
    if not path.exists() or not path.is_file():
        return

    text = read_text(path)
    suffix = path.suffix.lower()

    if suffix == ".css":
        inspect_css(path, text, issues)

    if suffix in {".tsx", ".jsx"}:
        inspect_react(path, text, issues)

    if path.as_posix().endswith("naverMapLoader.ts"):
        inspect_naver_loader(path, text, issues)

    if path.as_posix().endswith("ShopMap.tsx"):
        inspect_shop_map(path, text, issues)


def main() -> int:
    parser = argparse.ArgumentParser(description="Aniwhere PR preflight checks")
    parser.add_argument("--base", default="origin/main", help="Base ref for diff inspection")
    args = parser.parse_args()

    files = changed_files(args.base)
    issues: list[str] = []

    print(f"Base: {args.base}")
    print(run_git(["diff", "--stat", f"{args.base}...HEAD"]) or "No diff")
    print(f"Files inspected: {len(files)}")

    for path in files:
        inspect_file(path, issues)

    if issues:
        print("\nPotential review issues:")
        for issue in issues:
            print(f"- {issue}")
        return 1

    print("\nNo repeated CodeRabbit-style issues found by local preflight.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

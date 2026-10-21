from pathlib import Path

import pytest

from app.main import resolve_frontend_index, resolve_static_file


def make_static_tree(static_dir: Path) -> tuple[Path, Path]:
    legacy_index = static_dir / "legacy" / "index.html"
    legacy_index.parent.mkdir(parents=True)
    legacy_index.touch()

    (static_dir / "index.html").touch()

    other_file = static_dir / "assets" / "app.js"
    other_file.parent.mkdir()
    other_file.touch()

    return legacy_index, other_file


def test_resolve_frontend_index_prefers_legacy_page(tmp_path: Path):
    legacy_index = tmp_path / "legacy" / "index.html"
    legacy_index.parent.mkdir()
    legacy_index.touch()
    (tmp_path / "index.html").touch()

    assert resolve_frontend_index(tmp_path) == legacy_index


def test_resolve_frontend_index_falls_back_to_root_index(tmp_path: Path):
    index = tmp_path / "index.html"
    index.touch()

    assert resolve_frontend_index(tmp_path) == index


@pytest.mark.parametrize(
    ("full_path", "expected_path"),
    [
        ("", "legacy"),
        ("index.html", "legacy"),
        ("legacy/../index.html", "legacy"),
        ("../outside.txt", "legacy"),
        ("missing", "legacy"),
        ("legacy/index.html", "legacy"),
        ("assets/app.js", "other"),
    ],
)
def test_resolve_static_file_uses_resolved_path(
    tmp_path: Path,
    full_path: str,
    expected_path: str,
):
    static_dir = tmp_path / "static"
    static_dir.mkdir()
    legacy_index, other_file = make_static_tree(static_dir)
    (tmp_path / "outside.txt").touch()
    expected = other_file if expected_path == "other" else legacy_index

    assert resolve_static_file(static_dir, full_path) == expected


def test_resolve_static_file_falls_back_to_root_index_without_legacy(tmp_path: Path):
    root_index = tmp_path / "index.html"
    root_index.touch()

    assert resolve_static_file(tmp_path, "") == root_index

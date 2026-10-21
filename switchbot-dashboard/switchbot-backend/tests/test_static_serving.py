from pathlib import Path

from app.main import resolve_frontend_index


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
